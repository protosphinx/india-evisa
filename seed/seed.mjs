// Create the erp.ai app, its tables and columns, and load the seed content.
//
//   ERPAI_API_KEY=... node seed/seed.mjs            # creates a new app
//   ERPAI_API_KEY=... ERPAI_APP_ID=... node seed/seed.mjs [--reset]
//
// Safe to re-run: existing tables get any missing columns, and rows are only
// loaded into empty tables unless --reset clears them first.
// Prints the app id to stdout on the last line.

import { client } from '../lib/erpai.mjs';
import { APP, TABLES, NAME_COLUMN, camel } from './schema.mjs';
import { CONTENT } from './content.mjs';

const apiKey = process.env.ERPAI_API_KEY;
if (!apiKey) {
  console.error('ERPAI_API_KEY is required');
  process.exit(1);
}
const baseUrl = process.env.ERPAI_BASE_URL;
const reset = process.argv.includes('--reset');
const COLORS = ['blue', 'green', 'yellow', 'red', 'gray'];
// Create responses come back as { body: {...} } or unwrapped, depending on route.
const idOf = (res) => res.body?._id ?? res.data?._id ?? res._id ?? res.id;

let appId = process.env.ERPAI_APP_ID;
if (!appId) {
  const created = await client({ baseUrl, apiKey }).call('POST', '/v1/app-builder/app', { body: APP });
  appId = idOf(created);
  console.error(`created app ${appId}`);
}

const api = client({ baseUrl, apiKey, appId });
const existing = new Map((await api.listTables()).map((t) => [t.name, t._id]));

function cellsFor(row, columns) {
  const cells = {};
  for (const col of columns) {
    const value = row[camel(col.name)];
    if (value === undefined || value === '' || value === null) continue;
    if (col.type === 'select') {
      const idx = (col.options ?? []).findIndex((o) => o.name === value);
      if (idx < 0) throw new Error(`"${value}" is not an option of ${col.name}`);
      cells[col.id] = [Number(col.options[idx].id ?? idx + 1)];
    } else {
      cells[col.id] = value;
    }
  }
  return cells;
}

for (const def of TABLES) {
  const defColumns = [NAME_COLUMN, ...def.columns];
  let tableId = existing.get(def.name);
  if (!tableId) {
    const created = await api.call('POST', '/v1/app-builder/table', {
      body: { appId, name: def.name, category: def.category, icon: def.icon, description: def.description },
    });
    tableId = idOf(created);
    if (!tableId) throw new Error(`no table id in response: ${JSON.stringify(created).slice(0, 200)}`);
    console.error(`created table ${def.name} (${tableId})`);
  }

  let meta = await api.getTable(tableId);
  const missing = defColumns.filter((c) => !meta.columnsMetaData.some((m) => m.name === c.name));
  if (missing.length) {
    await api.call('POST', `/v1/app-builder/table/${tableId}/column/bulk`, {
      body: {
        appId,
        columns: missing.map((c) => ({
          name: c.name,
          type: c.type,
          ...(c.options ? { options: c.options.map((name, i) => ({ id: i + 1, name, color: COLORS[i % COLORS.length] })) } : {}),
        })),
      },
    });
    meta = await api.getTable(tableId);
    console.error(`added ${missing.map((c) => c.name).join(', ')} to ${def.name}`);
  }

  const columns = meta.columnsMetaData.filter((m) => defColumns.some((c) => c.name === m.name));
  const nameCol = columns.find((c) => c.name === NAME_COLUMN.name);
  if (meta.nameField !== nameCol.id) {
    await api.call('PUT', `/v1/app-builder/table/${tableId}`, { body: { appId, nameField: nameCol.id } });
  }

  const old = await api.allRecords(tableId);
  if (old.length && !reset) {
    console.error(`${def.name} already has ${old.length} rows, skipping (pass --reset to reload)`);
    continue;
  }
  if (old.length) {
    await api.call('DELETE', `/v1/app-builder/table/${tableId}/record`, { body: old.map((r) => r._id) });
    console.error(`cleared ${old.length} rows from ${def.name}`);
  }

  const rows = CONTENT[def.key];
  for (let i = 0; i < rows.length; i += 50) {
    await api.call('POST', `/v1/app-builder/table/${tableId}/record-bulk`, {
      body: { appId, arr: rows.slice(i, i + 50).map((row) => ({ cells: cellsFor(row, columns) })) },
    });
  }
  console.error(`loaded ${rows.length} rows into ${def.name}`);
}

console.log(appId);
