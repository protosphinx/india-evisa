# India e-Visa redesign concept

A redesign of the India e-Visa portal home page
(indianvisaonline.gov.in/evisa/tvoa.html). It is a design concept, not an
official site: it accepts no applications or payments, and every action links
to the official portal.

Live: https://india-evisa.build.host

## How it works

- **Content** lives in an ERP.ai app called "India e-Visa Portal": eight tables
  (Services, Notices, Visa Types, Entry Ports, Checklist, FAQs, Helpdesks,
  Useful Links). Edit a row there and the site picks it up within five minutes.
- **Server** (`server.mjs`) is plain Node with no dependencies. It serves
  `public/` and `/api/content`, which reads the ERP.ai tables server-side with
  a read-only key and caches the result. If ERP.ai is unreachable it serves the
  last good copy, or the bundled snapshot in `seed/content.mjs`.
- **Frontend** (`public/`) is static HTML, CSS and a single ES module. It
  supports light and dark themes, three text sizes, and phone widths.

## Run locally

```bash
ERPAI_API_KEY=erp_pat_live_... ERPAI_APP_ID=50d6b33fcf63cc9bb87ecf86 npm start
```

Without the env vars the server runs on the bundled snapshot.

| Variable | Default | Purpose |
|---|---|---|
| `ERPAI_API_KEY` | none | Key with `records:read`, `tables:read`, `schema:read` |
| `ERPAI_APP_ID` | none | ERP.ai app holding the content |
| `ERPAI_BASE_URL` | `https://apps.erp.ai` | ERP.ai API origin |
| `CACHE_SECONDS` | `300` | How long `/api/content` caches ERP.ai reads |
| `PORT` | `3000` | Listen port |

## Seeding ERP.ai

`seed/seed.mjs` creates the app, tables and columns from `seed/schema.mjs` and
loads `seed/content.mjs`. It needs a key with app, table, schema and record
write scopes. It is safe to re-run: missing columns are added, and rows are
only loaded into empty tables unless you pass `--reset`.

```bash
ERPAI_API_KEY=... node seed/seed.mjs                      # new app
ERPAI_API_KEY=... ERPAI_APP_ID=... node seed/seed.mjs --reset
```

Content was summarised from the official portal on 2026-10-26. Visa terms,
fees and entry ports change; the official portal is the source of truth.
