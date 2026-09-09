# Hostera

Hospitality management Dev by Vincent Nogue Ceo Of Liafrik www.liafrik.com

Global Hospitality Operating System — multi-tenant SaaS for property management.

## Stack

- **Frontend**: React + Vite, React Router, Tailwind, shadcn/ui
- **Backend**: [Supabase](https://supabase.com) (Postgres, Auth, Storage)
- **Hosting**: Cloudflare Pages

The app talks to Supabase through `src/lib/hosteraBackend.js`, which every
page reads via `globalThis.__B44_DB__` — a naming leftover from this
project's previous backend, kept only so the ~68 page components (which all
call `db.entities.X.list()/create()/update()/delete()` and `db.auth.*`)
didn't need to be individually rewritten during the migration.

## Local setup

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key
npm run dev
```

Required env vars (see `.env.example`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (the public "anon" key — never the `service_role` key)

These are inlined into the JS bundle **at build time**, not read at runtime.
If you change them, you need a fresh `npm run build` (or a fresh deploy) —
restarting `npm run dev` is enough for local work.

## Database

`supabase/schema.sql` is a runnable starting schema: one table per entity the
frontend actually calls, with row-level security enforcing per-organization
tenant isolation (see the comments at the top of that file for exactly what
it does and doesn't cover). Run it in the Supabase SQL editor for a new
project. It uses a generic `data jsonb` column per table rather than
hand-modeled columns — promote fields to real typed columns as your schema
solidifies.

## Deploying (Cloudflare Pages)

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- Set the two `VITE_SUPABASE_*` env vars above under Pages project →
  Settings → Environment variables, for both Production and Preview —
  then trigger a fresh deployment (adding them after a build doesn't
  retroactively apply to that build's bundle).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run typecheck` | `tsc` against `jsconfig.json` |
| `npm run preview` | Serve the built `dist/` locally |
