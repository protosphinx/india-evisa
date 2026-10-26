// Minimal erp.ai REST client (https://apps.erp.ai, app-builder API).

import { TABLES, NAME_COLUMN, camel } from '../seed/schema.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function client({ baseUrl, apiKey, appId }) {
  const base = (baseUrl || 'https://apps.erp.ai').replace(/\/$/, '');

  async function call(method, path, { query = {}, body, timeoutMs = 15000 } = {}) {
    const url = new URL(base + path);
    for (const [k, v] of Object.entries({ appId, ...query })) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    let res;
    for (let attempt = 0; ; attempt++) {
      res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status !== 429 || attempt === 4) break;
      const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * 2 ** attempt;
      await sleep(Math.min(wait, 30000));
    }
    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    if (!res.ok || json.success === false) {
      const msg = json.message || json.error?.message || json.error || text.slice(0, 300);
      const details = json.details ? ` ${JSON.stringify(json.details).slice(0, 600)}` : '';
      throw new Error(`erp.ai ${method} ${path} -> ${res.status}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}${details}`);
    }
    return json;
  }

  return {
    call,
    listTables: async () => (await call('GET', '/v1/app-builder/table', { query: { pageSize: 100 } })).data ?? [],
    getTable: async (id) => {
      const json = await call('GET', `/v1/app-builder/table/${id}`);
      return json.body ?? json;
    },
    async allRecords(tableId) {
      const rows = [];
      for (let pageNo = 1; pageNo < 50; pageNo++) {
        const page = await call('POST', `/v1/app-builder/table/${tableId}/paged-record`, {
          query: { pageNo, pageSize: 100, sortCol: 'CTDT', sortDir: 1 },
          body: {},
        });
        rows.push(...(page.data ?? []));
        if (!page.data?.length || rows.length >= (page.totalCount ?? 0)) break;
      }
      return rows;
    },
  };
}

// Convert one record's cells (keyed by column id) into { camelName: value },
// keeping only the columns the schema defines (system columns are dropped).
function decode(record, columns) {
  const out = { id: record._id };
  for (const col of columns) {
    const raw = record.cells?.[col.id];
    const key = camel(col.name);
    if (col.type === 'select' || col.type === 'multi-select') {
      const ids = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
      const names = ids.map((v) => {
        const idx = (col.options ?? []).findIndex((o, i) => String(o.id ?? i + 1) === String(v));
        return idx >= 0 ? col.options[idx].name : null;
      }).filter(Boolean);
      out[key] = col.type === 'select' ? names[0] ?? '' : names;
    } else if (col.type === 'boolean') {
      out[key] = Array.isArray(raw) ? raw.includes(1) : Boolean(raw);
    } else {
      out[key] = raw ?? (col.type === 'number' ? null : '');
    }
  }
  return out;
}

// Read every portal table from the app and return { services: [...], ... }.
export async function readPortal(api) {
  const tables = await api.listTables();
  const byName = new Map(tables.map((t) => [t.name, t._id]));
  const entries = await Promise.all(TABLES.map(async (def) => {
    const id = byName.get(def.name);
    if (!id) throw new Error(`erp.ai app has no "${def.name}" table`);
    const [meta, records] = await Promise.all([api.getTable(id), api.allRecords(id)]);
    const wanted = new Set([NAME_COLUMN, ...def.columns].map((c) => c.name));
    const columns = (meta.columnsMetaData ?? []).filter((c) => wanted.has(c.name));
    const rows = records
      .map((r) => decode(r, columns))
      .sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
    return [def.key, rows];
  }));
  return Object.fromEntries(entries);
}
