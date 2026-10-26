// Serves the static site, /api/content (portal content read from erp.ai with
// a server-side key, cached for CACHE_SECONDS) and /api/applications/* (demo
// applications written to the erp.ai Applications table).

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { client, readPortal } from './lib/erpai.mjs';
import { applications, newReference, validate } from './lib/applications.mjs';
import { CONTENT } from './seed/content.mjs';

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const TTL_MS = (Number(process.env.CACHE_SECONDS) || 300) * 1000;
const { ERPAI_API_KEY, ERPAI_APP_ID, ERPAI_BASE_URL } = process.env;

const api = ERPAI_API_KEY && ERPAI_APP_ID
  ? client({ baseUrl: ERPAI_BASE_URL, apiKey: ERPAI_API_KEY, appId: ERPAI_APP_ID })
  : null;

const store = api ? applications(api) : null;

let cache = null;
let inflight = null;

const snapshot = (reason) => ({ ...CONTENT, meta: { source: 'snapshot', reason, fetchedAt: null } });

async function content() {
  if (!api) return snapshot('erp.ai is not configured');
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  inflight ??= readPortal(api)
    .then((data) => {
      const value = { ...data, meta: { source: 'erp.ai', appId: ERPAI_APP_ID, fetchedAt: new Date().toISOString() } };
      cache = { at: Date.now(), value };
      return value;
    })
    .catch((err) => {
      console.error(`[content] ${err.message}`);
      // Serve the last good copy if we have one, otherwise the bundled snapshot.
      return cache?.value ?? snapshot('erp.ai request failed');
    })
    .finally(() => { inflight = null; });
  return inflight;
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Robots-Tag': 'noindex',
    ...headers,
  });
  res.end(body);
}

const json = (res, status, data) => send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });

async function readJson(req, limit = 16384) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Request too large'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}

// Fixed-window limits per client IP, kept in memory.
const hits = new Map();
function limited(req, bucket, max, windowMs) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.start > windowMs) { hits.set(key, { start: now, n: 1 }); return false; }
  entry.n += 1;
  return entry.n > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (now - v.start > 3600000) hits.delete(k); }, 600000).unref();

const NOT_FOUND = 'No application matches that reference and email.';
const sameEmail = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

async function handleApplications(req, res, action) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Use POST' });
  if (!store) return json(res, 503, { error: 'Applications are not available: erp.ai is not configured.' });
  const body = await readJson(req);
  if (body.website) return json(res, 200, { ok: true }); // honeypot

  if (action === 'lookup') {
    if (limited(req, 'lookup', 30, 600000)) return json(res, 429, { error: 'Too many lookups. Try again in a few minutes.' });
    const reference = String(body.reference || '').trim().toUpperCase();
    const app = reference ? await store.find(reference) : null;
    if (!app || !sameEmail(app.email, String(body.email || '').trim())) return json(res, 404, { error: NOT_FOUND });
    const { id, officerNote, ...values } = app;
    return json(res, 200, {
      reference: app.reference,
      status: app.status,
      submittedAt: app.submittedAt || null,
      officerNote: officerNote || '',
      values: app.status === 'Draft' ? values : { name: app.name, visaType: app.visaType, arrivalDate: app.arrivalDate, portOfArrival: app.portOfArrival },
    });
  }

  if (limited(req, 'write', 20, 3600000)) return json(res, 429, { error: 'Too many submissions from this network. Try again later.' });
  const submit = action === 'submit';
  if (submit && body.consent !== true) return json(res, 400, { error: 'Confirm that you used sample data.', errors: { consent: 'Required' } });
  const { values, errors } = validate(body.values, { submit });
  if (Object.keys(errors).length) return json(res, 400, { error: 'Some fields need attention.', errors });

  const status = submit ? 'Submitted' : 'Draft';
  const extra = submit ? { status, submittedAt: new Date().toISOString() } : { status };
  const reference = String(body.reference || '').trim().toUpperCase();
  if (reference) {
    const existing = await store.find(reference);
    if (!existing || !sameEmail(existing.email, values.email)) return json(res, 404, { error: NOT_FOUND });
    if (existing.status !== 'Draft') return json(res, 409, { error: 'This application has already been submitted.' });
    await store.update(existing.id, { ...values, ...extra });
    return json(res, 200, { reference, status });
  }
  const ref = newReference();
  await store.create({ ...values, ...extra, reference: ref });
  return json(res, 201, { reference: ref, status });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/content') {
    const data = await content();
    return send(res, 200, JSON.stringify(data), {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    });
  }
  const appRoute = url.pathname.match(/^\/api\/applications\/(save|submit|lookup)$/);
  if (appRoute) {
    try {
      return await handleApplications(req, res, appRoute[1]);
    } catch (err) {
      console.error(`[applications] ${err.message}`);
      return json(res, err.status || 502, { error: err.status ? err.message : 'Could not reach erp.ai. Try again shortly.' });
    }
  }
  if (url.pathname === '/healthz') {
    return send(res, 200, JSON.stringify({ ok: true, erpai: Boolean(api), cachedAt: cache ? new Date(cache.at).toISOString() : null }), {
      'Content-Type': 'application/json',
    });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');

  const path = url.pathname === '/apply' || url.pathname === '/apply/' ? '/apply.html' : url.pathname;
  const rel = normalize(decodeURIComponent(path)).replace(/^([/\\])+/, '');
  const file = join(PUBLIC, rel === '' || rel.endsWith(sep) ? join(rel, 'index.html') : rel);
  if (!file.startsWith(PUBLIC)) return send(res, 403, 'Forbidden');

  try {
    const body = await readFile(file);
    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    return send(res, 200, req.method === 'HEAD' ? undefined : body, {
      'Content-Type': type,
      'Cache-Control': type.startsWith('text/html') ? 'no-cache' : 'public, max-age=3600',
    });
  } catch {
    const body = await readFile(join(PUBLIC, 'index.html'));
    return send(res, 404, body, { 'Content-Type': TYPES['.html'] });
  }
});

server.listen(PORT, () => {
  console.log(`listening on :${PORT} (content source: ${api ? 'erp.ai' : 'snapshot'})`);
  if (api) content();
});
