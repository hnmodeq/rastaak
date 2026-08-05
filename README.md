# RASTAAK — Next.js + TypeScript Landing Page

A Qumulo-style enterprise landing page, rebuilt as a modern **Next.js (App
Router) + TypeScript** project. Same design system and moving-gradient hero as
the original static version, now structured for real product work:

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Package manager:** pnpm
- **Storage:** Supabase buckets (with graceful fallback to local `public/assets`)
- **Database:** Neon (serverless Postgres) via **Prisma** — powers the demo-request form
- **Deploy:** Vercel (zero-config)

```
app/
  layout.tsx            root layout (metadata, Montserrat font, favicon)
  page.tsx              landing page composition
  globals.css           full design system (Qumulo-inspired tokens + moving gradients)
  api/contact/route.ts  POST endpoint → saves demo requests to Neon via Prisma
  icon.png              favicon (from your logo)
components/             Nav, Hero, Trust, Features, AiSection, Platform,
                        UseCases, CaseStudies, Industries, Partners, Support,
                        Stats, Resources, FinalCta, Footer, DemoForm, SiteEffects
lib/
  images.ts             image URL helper: Supabase storage if configured, else /public
  supabase.ts           Supabase client (guarded, optional)
prisma/
  schema.prisma         ContactSubmission model (Neon/Postgres)
public/assets/          images + logos (deployed as static files by default)
scripts/
  upload-assets-to-supabase.mjs   uploads public/assets → your Supabase bucket
legacy/                 the previous single-file static version (for reference)
```

## Getting started

```bash
pnpm install          # installs deps + runs `prisma generate` (postinstall)
pnpm dev              # http://localhost:3000
pnpm build && pnpm start
```

## 1. Storage — Supabase buckets (optional but recommended)

The site works out of the box using the local files in `public/assets/`. To
serve images from Supabase instead:

1. Create a project at [supabase.com](https://supabase.com).
2. Create a **public** bucket, e.g. `rastaak-assets`.
3. Copy `.env.example` → `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   NEXT_PUBLIC_SUPABASE_BUCKET=rastaak-assets
   SUPABASE_SERVICE_ROLE_KEY=     # only used by the upload script
   ```
4. Upload the assets:
   ```bash
   pnpm assets:upload
   ```
5. Set the same `NEXT_PUBLIC_*` values in Vercel → Project → Settings → Environment Variables.

`lib/images.ts` switches automatically: when `NEXT_PUBLIC_SUPABASE_URL` is set,
images come from the bucket; otherwise they fall back to `/assets/*`.

## 2. Database — Neon + Prisma

The landing page renders without a database; the DB backs the **"Request a demo"
form** in the final CTA section (`POST /api/contact`).

1. Create a serverless Postgres database at [neon.tech](https://neon.tech)
   (copy the **pooled** connection string).
2. Add `DATABASE_URL` to `.env.local` and to Vercel env vars.
3. Create the table:
   ```bash
   pnpm db:push
   ```
4. (optional) Browse it: `pnpm db:studio`

If `DATABASE_URL` is missing, `/api/contact` returns a clean `503` and the form
shows a friendly notice — nothing breaks.

> Tip: to use the connection pooler, append `?pgbouncer=true&sslmode=require`
> or use the pooled URL Neon provides for Prisma.

## 3. Deploy to Vercel

1. Push this repo to GitHub (it already is: `hnmodeq/rastaak`).
2. On [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Vercel auto-detects Next.js + pnpm — just hit **Deploy**.
4. Add the env vars above in Project Settings → Environment Variables.
5. Done. Add a custom domain whenever you like.

## Design system

All tokens live at the top of `app/globals.css`:

| Token | Value | Used for |
|---|---|---|
| `--ink` | `#08081b` | dark navy-black backgrounds |
| `--blue` | `#3463f1` | primary buttons, links, icons |
| `--blue-r` | `#2393d3` | RASTAAK logo bright blue (orbs/accents) |
| `--orange` | `#ff7a46` | accent + gradient text |
| `--peach` | `#ffe2d7` | gradient partner |
| Font | Montserrat | Google Fonts (link in `app/layout.tsx`) |

**Moving gradients** (hero slider, drifting orbs, shimmer text, liquid blob)
live in the "MOVING GRADIENTS" block of `globals.css` and the Hero component.
All animations respect `prefers-reduced-motion`.

## Project structure notes

- Interactive pieces are small `"use client"` components (`Nav`, `Hero`,
  `UseCaseChips`, `DemoForm`, `SiteEffects`); everything else is a server
  component → fast, SEO-friendly.
- Images use plain `<img>` (no `next/image`) so Supabase storage URLs work
  without extra config. `next.config.mjs` already whitelists `*.supabase.co`
  if you switch to `next/image` later.
- `legacy/` holds the old static `index.html` version — keep it for reference,
  or delete it.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev / production / serve |
| `pnpm lint` | Next.js lint |
| `pnpm db:push` | Push Prisma schema to Neon |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm db:studio` | Browse the database |
| `pnpm assets:upload` | Upload `public/assets` → Supabase bucket |
