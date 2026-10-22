# iGT · Market Research

A Next.js and TypeScript application built from the **visible tabs only** of the Winter 26.27 centralized market research workbook.

## Included

- Overview with live database counts, team progress, and resource shortcuts.
- Searchable company directory with team, product, industry, and status filters, pagination, CSV export, and add/edit forms.
- CRM-added and contacted toggles, call outcomes, booklet-sent status, follow-up dates, pitching points, and notes.
- Outreach view of companies marked as added to the CRM.
- Four team views: Team Ashmitha (10 companies), Apurwa (7), Team Avidu (13), and Team Thaniya (16).
- All seven Home workflow instructions and all 13 original resource URLs.
- A shared, persistent database; company records are never stored only in browser storage.

## Architecture

The frontend uses the genuine Next.js App Router and React, with a static production export. A small Cloudflare Worker serves the exported assets and `/api/companies` API. Cloudflare D1 provides durable shared SQLite storage, without database credentials in the browser. Sites provisions the private hosted deployment and D1 binding. This architecture keeps the requested Next.js frontend while supporting Sites hosting.

`npm run dev:ui` is useful for layout-only Next.js development; it does not provide the Worker API. Use the full app commands below for records and edits.

## Local development

Requires Node.js 22.13+ (Node 26 used for verification) and npm.

```sh
npm ci
npm run db:local
npm run dev
```

Open `http://127.0.0.1:3100`. The dev script builds the Next.js frontend and launches Wrangler with persistent local storage. Rebuild/restart after frontend changes. Local and hosted databases are separate. Wrangler uses a placeholder database ID for local development; do not use it for a manual remote deployment.

```sh
npm run typecheck
npm test
npm run build
```

## Workbook import

`data/workbook.json` is a snapshot of the uploaded file, including Home resources, normalized named-company records, original source row IDs, and any nonstandard extra cells. Hidden sheets are excluded before reading their cell data. One visible Team Avidu row has a member name but no company; it is retained in `importInfo.unassignedRows` and is not turned into a blank company. Phone values stored in Excel scientific notation are expanded; nine-digit Sri Lankan numbers receive a leading zero.

Recreate the snapshot from an authorized local workbook:

```sh
python3 scripts/import-workbook.py '/absolute/path/to/workbook.xlsx'
```

The initial 46 companies are imported atomically on the first database request. Subsequent visits do not reset edits or insert duplicate seed records. Changing the JSON later does not overwrite an already imported database.

## Access and integrations

The hosted site is initially owner-private; Sites handles sign-in and access. All permitted visitors share the same company directory. Per-team restrictions and individual application roles are not implemented. Keep the site private: the API relies on the Sites access boundary and rejects cross-origin writes. Local development should remain on loopback.

CRM Added is a manual tracking field, matching the spreadsheet. It does not create records in the external AIESEC CRM. Booklet Sent is also manual, not an email sender. Resources open their original destinations in a new tab; permissions remain controlled by their providers. The workbook is imported once, without continuous Google Sheets synchronization.

## Deployment

`.openai/hosting.json` records the Sites identity and D1 binding. The build produces `dist/client` (Next.js assets), `dist/server/index.js` (Worker), and `dist/.openai/hosting.json`. Drizzle contains schema-only migrations. Sites applies those migrations before serving the private deployment. Source changes are committed and pushed using the Sites source workflow before publication.
