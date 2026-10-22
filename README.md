# iGT · Market Research

A **local Next.js + TypeScript application** built from the visible tabs of the Winter 26.27 workbook. Keep development local; deployment is deferred until requested. No ChatGPT Sites or Cloudflare account is required.

## Run locally

Requires Node.js **22.13 or later** (Node 26 used for verification).

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:3100** (or http://localhost:3100).

This runs the Next.js frontend and API together, with hot reload. The first API request imports the workbook records. Edits persist in `.local/market-research.sqlite`, which is ignored by Git. No environment variables or database signup are needed for local use. Copy `.env.example` to `.env.local` only if you want to choose a different database path.

Previously created local preview records are preserved when migrating from the old preview database. Old `.wrangler` files can remain as an ignored backup; the application no longer uses them.

## Features

- Overview with company counts, team progress, and resource shortcuts.
- Team performance charts on Overview and Teams: research/CRM/contact counts, contact completion rates, GTe/GTa filters, and click-through to company records. Charts use current saved statuses, not historical activity trends.
- Company search, team/product/industry/status filters, pagination, CSV export, and add/edit forms.
- CRM and contacted toggles, call outcomes, booklet-sent status, follow-up dates, pitching points, and notes.
- Outreach view of companies marked as added to the CRM.
- Four teams: Team Ashmitha (10 imported companies), Apurwa (7), Team Avidu (13), and Team Thaniya (16).
- All seven Home workflow instructions and all 13 original resource links.
- A deeper emerald and olive palette, with stronger text contrast and distinct status colors.

## Checks and production build

```sh
npm test
npm run build
npm run typecheck
npm start
```

`npm start` serves a production build locally on port 3100. `npm run dev` runs the development server.

## Source layout

- `app/` — Next.js pages and route handlers.
- `app/theme.css` — color palette overrides.
- `components/workspace.tsx` — dashboard, directory, team views, resources, and company editor.
- `lib/company-api.mjs` — input validation, workbook seeding, and company operations.
- `lib/database.mjs` — persistent local SQLite storage.
- `data/workbook.json` — visible workbook contents and original resource URLs.
- `scripts/import-workbook.py` — workbook importer, excluding hidden tabs before reading cell data.

## Workbook import

The snapshot contains 46 named companies. One Team Avidu row contains a member name without a company and is retained in `importInfo.unassignedRows`. Nonstandard cells and original source row IDs are preserved. Excel scientific notation phone values are expanded; nine-digit Sri Lankan numbers receive a leading zero.

```sh
python3 scripts/import-workbook.py '/absolute/path/to/workbook.xlsx'
```

The seed runs once per database. Re-importing the snapshot does not overwrite saved database edits. The source workbook remains unchanged.

## Vercel later

The project now uses standard `next dev`, `next build`, and `next start`, with native Next.js API route handlers and no Worker/static export adapter. When the application is complete, set the Vercel project root to `B2B-Market-Research`.

**Before deployment:** replace the development SQLite connection with a persistent hosted database and add application sign-in/access controls. Vercel's function filesystem is not durable storage. The local adapter deliberately refuses to run when `VERCEL` is set, to prevent lost records. No deployment or remote database provisioning is performed by the local development workflow.

## Current integration behavior

CRM Added and Booklet Sent remain manual tracking fields, matching the spreadsheet. They do not automatically create external CRM records or send email. Resource links open their original destinations and retain their providers' access requirements. The workbook is a one-time import, without live Google Sheets synchronization.
