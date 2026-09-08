# AGENTS.md

## Project context

Hostera is a multi-tenant hotel-management SaaS. React + Vite frontend,
Supabase backend (Postgres + Auth + Storage), deployed to Cloudflare Pages.
This repo previously ran on base44; that dependency has been fully removed
(see the "migrate off base44 to Supabase" commit for the rationale).

Start with `README.md` for local setup, env vars, and the deploy workflow.

## Key files

- `src/lib/supabaseClient.js`: the Supabase client (from `VITE_SUPABASE_URL`
  / `VITE_SUPABASE_ANON_KEY`). Never call `createClient` without guarding for
  missing env vars — it throws synchronously, which crashes the app before
  React mounts (this caused a real blank-white-screen bug; see the fallback
  stub pattern already in that file if you touch it).
- `src/lib/hosteraBackend.js`: implements `db.auth` / `db.entities` /
  `db.integrations` on top of Supabase and sets `globalThis.__B44_DB__`.
  Every page component reads that global (with an inline empty-stub
  fallback) instead of importing a client directly — that pattern predates
  this migration and touching all ~68 page files wasn't worth the risk, so
  new backend behavior belongs in this one file, not spread across pages.
- `src/main.jsx` / `index.html`: both carry a last-resort error net (inline
  script in `index.html`, try/catch around the render in `main.jsx`) so a
  script failure before React mounts always shows a message instead of a
  silent blank page. Keep both if you touch either file.
- `supabase/schema.sql`: schema + RLS scaffold, meant to be run manually in
  the Supabase SQL editor — nothing in this repo executes it automatically.

## Working notes

- `npm run build` inlines `VITE_*` env vars at build time. Changing them on
  Cloudflare requires a fresh deployment, not just a settings change.
- No legacy `@/entities` or `@/integrations` imports exist in this codebase
  (verified by grep before removing the old build plugin that used to
  support them) — don't reintroduce that pattern without checking again.
- Run `npm run lint` and `npm run build` before finishing changes; both must
  pass clean.
