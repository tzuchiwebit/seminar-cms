# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

慈濟全球共善學思會 — Seminar CMS. A multi-site event management system for conferences/symposiums with bilingual (Chinese/English) support.

## Commands

```bash
npm run dev              # Dev server → http://localhost:3000
npm run build            # Production build (static export → out/)
npm start                # Start production server
```

No test framework is configured.

## Tech Stack

Next.js 15 (App Router, static export), TypeScript (strict), Tailwind CSS v4, PocketBase JS SDK (hosted on PocketHost). Path alias: `@/*` → `./src/*`.

## Architecture

**Backend:** PocketHost at `https://academic-events.pockethost.io/`. All data is stored in PocketBase collections. No server-side code — everything is client-side rendered (admin) or pre-built at deploy time (public).

**Multi-tenancy:** Each Site has its own slug, content, and settings. All collections reference a `site` relation field.

**Pre-built public site:** Public pages are statically generated at build time via `pb-server.ts`. Data is fetched from PocketBase during `npm run build` and embedded in HTML. In dev mode, falls back to client-side fetching via `pb-queries.ts`.

**Route structure:**
- `src/app/(public)/[[...slug]]/` — Pre-built pages with data from build time; falls back to client fetch in dev
- `src/app/admin/page.tsx` — Admin dashboard (site list) + site detail editor (via `?site=slug` query param)
- `src/app/admin/SiteDashboardClient.tsx` — Site CMS editor (all panels: speakers, programme, venues, etc.)

**Data layer:**
- `src/lib/pb.ts` — PocketBase client singleton (client-side)
- `src/lib/pb-server.ts` — PocketBase instance for server-side/build-time fetching
- `src/lib/pb-queries.ts` — Reusable query functions for client-side (dev mode fallback)

**Auth:** PocketBase built-in auth via `src/hooks/useAuth.ts`. Login with email/password at `/admin/login`. No middleware — auth is checked client-side. Admin accounts managed in PocketHost dashboard.

**File uploads:** PocketBase file fields on records (e.g., `speakers.photo`, `venues.image`). URLs via `pb.files.getURL(record, filename)`.

**Bilingual fields:** Separate fields per language (e.g., `titleZh`/`titleEn`, `nameCn`/`name`).

**PocketBase field note:** The `speakers` collection uses `title_field` instead of `title` (PocketBase reserved word).

## PocketBase Collections

10 collections: `sites`, `speakers`, `days`, `sessions`, `session_speakers`, `papers`, `venues`, `exhibitions`, `registrations`, `site_settings`. Plus built-in `users` auth collection.

Key relationships: Site → Day → Session → SessionSpeaker (M-to-M with role), Session → Paper, Site → Speaker/Venue/Exhibition/Registration.

Key site_settings keys: `site_language` (`en`/`zh`/`both`), `section_*_visible` (toggle sections), `registration_google_form_url`.

## Environment Variables

Optional: `NEXT_PUBLIC_POCKETBASE_URL` (defaults to `https://academic-events.pockethost.io/`).

## Design Tokens

Cream: #F5F1EB, Dark: #1A1816, Gold: #9B7B2F, Green: #3D5A3E, Sidebar: #3D3A36, Border: #E5E0D8, Muted: #5A554B. Fonts: Inter, Noto Serif TC, Noto Sans TC.

## Deployment

Runtime mode on Cloudflare Pages (Functions). Build via `@cloudflare/next-on-pages`: build command `npx @cloudflare/next-on-pages@1`, output directory `.vercel/output/static`. Public pages render at request time and pull live data from Drust on every visit, so admin saves are immediately visible — no republish step.

Required Cloudflare Pages environment variables: `DRUST_TOKEN` (encrypted), `DRUST_BASE_URL`, `NEXT_PUBLIC_DB_BACKEND` (`drust` or `pb`), `NEXT_PUBLIC_POCKETBASE_URL`.
