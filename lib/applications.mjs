// Demo applications stored in the erp.ai "Applications" table.

import { randomInt } from 'node:crypto';
import { APPLICATIONS, NAME_COLUMN, camel } from '../seed/schema.mjs';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FIELDS = [NAME_COLUMN, ...APPLICATIONS.columns];

export const newReference = () => {
  const part = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `EV-${part()}-${part()}`;
};

// --- validation -------------------------------------------------------------

const DAY = 86400000;
const isoDay = (d) => new Date(d).toISOString().slice(0, 10);
const RULES = {
  visaType: { max: 60, required: true },
  nationality: { max: 60, required: true },
  email: { max: 120, required: true, re: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: 'Enter a valid email address' },
  phone: { max: 30, re: /^[+\d\s()-]*$/, msg: 'Use digits, spaces and + only' },
  arrivalDate: { date: true, required: true },
  portOfArrival: { max: 60, required: true },
  name: { max: 100, required: true },
  dateOfBirth: { date: true, required: true },
  passportNumber: { max: 12, required: true, re: /^[A-Z0-9]{6,12}$/, msg: 'Use 6 to 12 letters and digits' },
  purposeDetails: { max: 1000 },
};

// Returns { values, errors }. Drafts only need an email; submissions need
// every required field and an arrival date 4 to 120 days ahead.
export function validate(input = {}, { submit = false } = {}) {
  const values = {};
  const errors = {};
  for (const [key, rule] of Object.entries(RULES)) {
    let v = input[key];
    if (v === undefined || v === null) v = '';
    if (typeof v !== 'string') { errors[key] = 'Invalid value'; continue; }
    v = v.trim();
    if (key === 'passportNumber') v = v.toUpperCase().replace(/\s/g, '');
    if (!v) {
      if ((submit && rule.required) || (key === 'email')) errors[key] = 'Required';
      continue;
    }
    if (rule.max && v.length > rule.max) { errors[key] = `At most ${rule.max} characters`; continue; }
    if (rule.re && !rule.re.test(v)) { errors[key] = rule.msg; continue; }
    if (rule.date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) { errors[key] = 'Invalid date'; continue; }
    }
    values[key] = v;
  }
  if (values.dateOfBirth && Date.parse(values.dateOfBirth) >= Date.now()) errors.dateOfBirth = 'Must be in the past';
  if (submit && values.arrivalDate) {
    const days = (Date.parse(values.arrivalDate) - Date.parse(isoDay(Date.now()))) / DAY;
    if (days < 4 || days > 120) errors.arrivalDate = 'Arrival must be 4 to 120 days from today';
  }
  return { values, errors };
}

// --- storage ----------------------------------------------------------------

export function applications(api) {
  let meta = null;

  async function table() {
    if (meta && Date.now() - meta.at < 600000) return meta;
    const t = (await api.listTables()).find((x) => x.name === APPLICATIONS.name);
    if (!t) throw new Error('erp.ai app has no Applications table; run the seed');
    const m = await api.getTable(t._id);
    meta = { tableId: t._id, cols: new Map(m.columnsMetaData.map((c) => [c.name, c])), at: Date.now() };
    return meta;
  }

  function toCells(values, cols) {
    const cells = {};
    for (const f of FIELDS) {
      const v = values[camel(f.name)];
      const col = cols.get(f.name);
      if (v === undefined || !col) continue;
      if (f.type === 'select') {
        const idx = (col.options ?? []).findIndex((o) => o.name === v);
        if (idx >= 0) cells[col.id] = [Number(col.options[idx].id ?? idx + 1)];
      } else if (f.type === 'date') {
        cells[col.id] = v ? (v.length === 10 ? `${v}T00:00:00.000Z` : v) : null;
      } else {
        cells[col.id] = v === '' ? null : v;
      }
    }
    return cells;
  }

  function fromRecord(rec, cols) {
    const out = { id: rec._id };
    for (const f of FIELDS) {
      const col = cols.get(f.name);
      if (!col) continue;
      const raw = rec.cells?.[col.id];
      const key = camel(f.name);
      if (f.type === 'select') {
        const v = Array.isArray(raw) ? raw[0] : raw;
        const idx = (col.options ?? []).findIndex((o, i) => String(o.id ?? i + 1) === String(v));
        out[key] = idx >= 0 ? col.options[idx].name : '';
      } else if (f.type === 'date') {
        out[key] = raw && f.name !== 'Submitted At' ? String(raw).slice(0, 10) : raw ?? '';
      } else {
        out[key] = raw ?? '';
      }
    }
    return out;
  }

  return {
    async find(reference) {
      const { tableId, cols } = await table();
      const refCol = cols.get('Reference');
      // Full-text search narrows the page; the exact match happens here.
      const page = await api.call('POST', `/v1/app-builder/table/${tableId}/paged-record`, {
        query: { pageNo: 1, pageSize: 25, q: reference },
        body: {},
      });
      const rec = (page.data ?? []).find((r) => r.cells?.[refCol.id] === reference);
      return rec ? fromRecord(rec, cols) : null;
    },
    async create(values) {
      const { tableId, cols } = await table();
      await api.call('POST', `/v1/app-builder/table/${tableId}/record`, { body: { appId: api.appId, cells: toCells(values, cols) } });
    },
    async update(id, values) {
      const { tableId, cols } = await table();
      await api.call('PUT', `/v1/app-builder/table/${tableId}/record/${id}`, { body: { appId: api.appId, cells: toCells(values, cols) } });
    },
  };
}
