# India e-Visa redesign concept

An open-source redesign of the India e-Visa portal
(indianvisaonline.gov.in/evisa/tvoa.html), with a working prototype of the
application flow. It is not an official site and is not affiliated with the
Government of India. Applications made here are demo records: no visa is
issued and no fee is taken.

Live: https://india-evisa.build.host · Apply flow: https://india-evisa.build.host/apply

The code is MIT licensed. Government teams, vendors and anyone else are free to
use, adapt and deploy it.

## How it works

- **Content** lives in an ERP.ai app called "India e-Visa Portal": eight tables
  (Services, Notices, Visa Types, Entry Ports, Checklist, FAQs, Helpdesks,
  Useful Links). Edit a row there and the site picks it up within five minutes.
- **Server** (`server.mjs`) is plain Node with no dependencies. It serves
  `public/` and `/api/content`, which reads the ERP.ai tables server-side with
  its own key and caches the result. If ERP.ai is unreachable it serves the
  last good copy, or the bundled snapshot in `seed/content.mjs`.
- **Frontend** (`public/`) is static HTML, CSS and plain ES modules. It
  supports light and dark themes, three text sizes, and phone widths.
- **Apply flow** (`/apply`) is a four-step form: trip and contact, applicant,
  documents, review. It saves drafts and submissions to the ERP.ai
  "Applications" table through `/api/applications/save|submit|lookup`.
  "Continue a saved application" and "Check status" look a record up by its
  reference (`EV-XXXX-XXXX`) plus the applicant's email. Changing Status or
  Officer Note on the row in ERP.ai shows up on the status page, so the ERP.ai
  app doubles as a simple case-officer console. Documents are checked in the
  browser against the portal's size and format rules and are not uploaded.

## Run locally

```bash
ERPAI_API_KEY=erp_pat_live_... ERPAI_APP_ID=50d6b33fcf63cc9bb87ecf86 npm start
```

Without the env vars the server runs on the bundled snapshot.

| Variable | Default | Purpose |
|---|---|---|
| `ERPAI_API_KEY` | none | Key with `records:read`, `records:write`, `tables:read`, `schema:read`, ideally restricted to the one app |
| `ERPAI_APP_ID` | none | ERP.ai app holding the content |
| `ERPAI_BASE_URL` | `https://apps.erp.ai` | ERP.ai API origin |
| `CACHE_SECONDS` | `300` | How long `/api/content` caches ERP.ai reads |
| `PORT` | `3000` | Listen port |

## Seeding ERP.ai

`seed/seed.mjs` creates the app, tables and columns from `seed/schema.mjs` and
loads `seed/content.mjs`. It needs a key with app, table, schema and record
write scopes. It is safe to re-run: missing columns are added and content rows
are upserted by Name. `--reset` deletes content rows first. The Applications
table only gets its schema; the seed never touches submitted rows.

```bash
ERPAI_API_KEY=... node seed/seed.mjs                      # new app
ERPAI_API_KEY=... ERPAI_APP_ID=... node seed/seed.mjs --reset
```

## Taking this to production

This repository is a starting point, not a drop-in replacement for the live
service. An official deployment would also need, at least:

- Hosting on government or MeitY-empanelled infrastructure, with applicant
  data stored in India and handled under the Digital Personal Data Protection
  Act, 2023.
- Integration with the existing Bureau of Immigration back end for
  applications, document storage, status and ETA issue, and with the payment
  gateways (SBI ePay, Axis Bank, Razorpay).
- A security audit by a CERT-In empanelled auditor, and protections the
  prototype does not have (bot checks, persistent rate limits, audit logging).
- Compliance with the Guidelines for Indian Government Websites (GIGW 3.0) and
  WCAG 2.1 AA, plus Hindi and other Indian languages.
- The full application form: the prototype collects a subset of the fields the
  official form asks for.

See [CONTRIBUTING.md](CONTRIBUTING.md) to help.

## Source

Content was summarised from the official portal on 2026-10-26. Visa terms,
fees and entry ports change; the official portal is the source of truth.
