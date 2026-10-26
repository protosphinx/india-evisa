// Serves the static site and /api/content, which reads the portal content
// from erp.ai with a server-side key and caches it for CACHE_SECONDS.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { client, readPortal } from './lib/erpai.mjs';
import { CONTENT } from './seed/content.mjs';

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const TTL_MS = (Number(process.env.CACHE_SECONDS) || 300) * 1000;
const { ERPAI_API_KEY, ERPAI_APP_ID, ERPAI_BASE_URL } = process.env;

const api = ERPAI_API_KEY && ERPAI_APP_ID
  ? client({ baseUrl: ERPAI_BASE_URL, apiKey: ERPAI_API_KEY, appId: ERPAI_APP_ID })
  : null;

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
  res.writeHead(status, { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', ...headers });
  res.end(body);
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
  if (url.pathname === '/healthz') {
    return send(res, 200, JSON.stringify({ ok: true, erpai: Boolean(api), cachedAt: cache ? new Date(cache.at).toISOString() : null }), {
      'Content-Type': 'application/json',
    });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');

  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
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
