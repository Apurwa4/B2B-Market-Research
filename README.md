# iGT · Market Research

A **Next.js + TypeScript application** built from the visible tabs of the Winter 26.27 workbook. Develop locally with SQLite, and publish to Vercel with Supabase storage. The workspace is currently public: anyone with the URL can view, add, and edit company records without signing in. No ChatGPT Sites or Cloudflare account is required.

## Run locally

Vercel targets Node.js **24.x**. Local checks have also passed on Node 26.

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
- `lib/database.mjs` — selects local SQLite or hosted Supabase storage.
- `lib/supabase-store.mjs` — server-only hosted company operations.
- `lib/access-policy.mjs` and `lib/workspace-auth.ts` — public access by default, with optional invited-email authorization.
- `data/workspace-content.json` — public interface copy and links, without private company seed data.
- `data/workbook.json` — visible workbook contents and original resource URLs.
- `scripts/import-workbook.py` — workbook importer, excluding hidden tabs before reading cell data.

## Workbook import

The snapshot contains 46 named companies. One Team Avidu row contains a member name without a company and is retained in `importInfo.unassignedRows`. Nonstandard cells and original source row IDs are preserved. Excel scientific notation phone values are expanded; nine-digit Sri Lankan numbers receive a leading zero.

```sh
python3 scripts/import-workbook.py '/absolute/path/to/workbook.xlsx'
```

The seed runs once per database. Re-importing the snapshot does not overwrite saved database edits. The source workbook remains unchanged.

## Publish on Vercel

The workspace is public by default on both localhost and Vercel. No email verification is required, and sign-in emails are disabled in public mode. Anyone with the deployed URL can view, add, and edit records. Database credentials remain on the server; Supabase browser access stays restricted.

1. Create or select a Supabase project and apply `supabase/migrations/202610220001_research_workspace.sql`. Tables have RLS enabled; browser roles cannot access the company data directly.
2. Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` as server environment variables. `.env.example` lists the names. Do not commit secret values.
3. Before allowing hosted company requests, transfer the current local database, including saved edits:

   ```sh
   npm run db:transfer
   npm run db:transfer -- --apply
   ```

   The first command is a dry run. The apply command refuses to overwrite an existing hosted dataset and verifies every transferred company. It does not change the local database.

4. Import `Apurwa4/B2B-Market-Research` into Vercel. Use Next.js, Node.js 24.x, and the default repository root (the directory containing `package.json`). Set the Supabase environment variables in Vercel.
5. Leave `WORKSPACE_ACCESS_MODE` unset or set it to `public`, then deploy. Existing email allowlists and the old `WORKSPACE_AUTH_REQUIRED` setting do not restrict public access.

`npm run deploy:check` checks the environment names without printing keys. `vercel.json` supplies standard Next.js build settings. The same Supabase database is used across deployments, so saved records are preserved.

To restore private access later, set `WORKSPACE_ACCESS_MODE=private`, configure `WORKSPACE_ALLOWED_EMAILS` with approved email addresses, and redeploy. Set `WORKSPACE_SITE_URL` to the deployed HTTPS origin and configure that origin plus `<origin>/auth/callback` in Supabase Authentication URL Configuration. Private mode requires verified email ownership on both pages and API requests; an empty allowlist grants nobody access. Set up Supabase email delivery before enabling private mode. For local testing against the cloud database, also set `WORKSPACE_DATABASE=supabase`.

## Current integration behavior

CRM Added and Booklet Sent remain manual tracking fields, matching the spreadsheet. They do not automatically create external CRM records or send email. Resource links open their original destinations and retain their providers' access requirements. The workbook is a one-time import, without live Google Sheets synchronization.
