# Multi-Site Scaling Roadmap

**Status:** Not started. Reference / decision log.
**Created:** 2026-04-24
**Context:** This CMS is intended to host 10+ conference/symposium sites on a shared stack. This document captures the target architecture and the staged migration path.

## Stack decision (keep current)

**Do not change the stack.** Next.js static export + Cloudflare Pages + PocketBase (PocketHost now, self-hosted VPS later) is the sweet spot for this use case.

Reasons to keep:
- **Traffic profile is spiky.** Academic events see large bursts around registration deadlines and event days. Static export on a CDN absorbs spikes for free. ISR/SSR requires server scaling + PB upgrade.
- **Hosting cost stays near-zero per site.** Cloudflare Pages free tier handles each site. 20 sites × Vercel Pro = expensive with no real benefit.
- **PocketBase is self-hostable.** Single Go binary. When PocketHost pricing starts hurting, move to a $5-10/mo VPS that can easily handle 100+ sites.
- **Content-editor UX.** PB admin UI is already decent and familiar; swapping backends means rebuilding admin or teaching users a new tool.

What NOT to do (ruled out):
- Move to SSR / on-demand rendering → loses static advantages, increases runtime cost.
- Migrate to Strapi / Directus / Payload → large rewrite, no commensurate benefit.
- Build a plugin / block system for layouts → premature abstraction until a pattern repeats 5+ times.
- Per-site separate databases → completely unnecessary at this scale.

## Real bottlenecks at 10+ sites (in order of pain)

1. **Deploy coupling** (single Cloudflare Pages project rebuilds every site on every change).
2. **Schema drift & governance** (EAV site_settings, inconsistent per-site field coverage).
3. **File storage limits** (PB single-instance storage balloons with high-res photos).
4. **Admin UX** (site picker, search, bulk ops, templates).
5. **Per-site customization pressure** (requests for layout tweaks that don't map to existing fields).

Backend performance is NOT yet a bottleneck; 10 sites × ~200 records is tiny for PocketBase.

## Stage 1 — Before ~5 sites

Goal: eliminate the two biggest sources of future pain before they compound.

### 1.1 Split Cloudflare Pages into one project per site

**Problem:** current setup rebuilds every site on every edit. At 10 sites × 5 edits/week = 50 full rebuilds that should have been 10.

**Fix:**
- One Cloudflare Pages project per site.
- Each project has env var `NEXT_PUBLIC_SITE_SLUG=symposium` (or similar).
- `next.config.ts` reads that env var and generates paths for only that site (`[[...slug]]` resolves to one concrete slug).
- `pb-server.ts` at build time fetches only that site's data (filter by `site="..."`).
- Deploy hook per site triggers only that site's rebuild.

**New site workflow:** create CF project → set env var + deploy hook → paste hook URL into site_config. ~5 minutes total.

**Code touch points:**
- `next.config.ts` — conditional `generateStaticParams` output based on env var.
- `src/lib/pb-server.ts` — filter queries to target site only when env var is set; keep multi-site behavior as fallback for local dev.
- `src/app/(public)/[[...slug]]/page.tsx` — if env var set, treat root `/` as that site's home; drop the site-picker root page for per-site builds.
- Admin remains multi-site and stays on a separate domain (see Stage 2.1).

**Estimated effort:** 1 day. Tested on one site, then replicated.

### 1.2 site_settings → site_config single record

See `2026-04-24-site-settings-consolidation.md` for the detailed plan. Do this before Stage 1.1 since the new per-site build will want typed config access anyway.

### 1.3 Move file storage to Cloudflare R2

**Problem:** PocketHost storage tier is the first cost to hurt. High-res speaker photos × 10 sites × accumulating history = easy 5-10 GB.

**Fix:**
- Create R2 bucket(s), public-read via custom domain (e.g. `assets.tzuchi.org`).
- PocketBase file uploads → intercept in admin UI, upload direct to R2 via signed URL, store returned URL in a text field (instead of PB file field).
- Or: keep using PB file field for admin-side upload, run a post-upload hook that copies to R2 and rewrites URL. Simpler but doubles storage short-term.
- R2 egress to Cloudflare Pages is free → delivery speed + cost both improve.

**Code touch points:**
- All `pb.files.getURL(record, filename)` calls become `record.photo_url` (direct URL string).
- Upload flow in admin (speaker photo, favicon, banners, OG images, venue images) — direct R2 upload.
- `downscaleImage` helper stays; we upload the downscaled result to R2 instead of through PB.

**Estimated effort:** 2-3 days. Requires R2 account + custom domain setup + admin upload refactor.

## Stage 2 — Between 5 and 20 sites

Goal: admin tools keep up with the growing number of sites; backend stays unchanged.

### 2.1 Split admin app from public sites

**Problem:** per-site CF Pages projects (Stage 1.1) means admin is duplicated N times. Waste.

**Fix:**
- Admin becomes its own deployment at `admin.tzuchi.org` (single project).
- Public sites have only public routes — no `/admin` at all.
- Admin hits PB directly, same as today; just no longer bundled with every public site.

**Code touch points:**
- New Next.js project (or repurpose a folder) for admin-only build.
- Move `src/app/admin/` to the new project.
- Delete admin routes from the site-build output.

**Estimated effort:** 1 day after Stage 1.1.

### 2.2 Admin dashboard UX improvements

**Problem:** at 10 sites the current dashboard list is fine. At 20 it's starting to hurt.

**Fix:** add on the existing dashboard:
- **Search / filter** by site name, slug, status.
- **Sort** by last_updated, event date.
- **Clone template** — "new site from existing site" copies settings + theme but blank content.
- **Bulk actions** — toggle `section_tour_visible` across selected sites, trigger all deploy hooks, etc.
- **Status indicators** — last build status (success/fail), last publish time, pending changes since last deploy.

**Effort:** 2-3 days; incremental.

### 2.3 Layout presets (config-driven)

**Problem:** clients start asking "can we move section X to the top" or "hide the hero entirely" — varieties that don't map to current toggles.

**Fix (before building a block system):**
- Add `layout_template` field to site_config with 2-3 presets: `default`, `minimal`, `exhibition-first`.
- Public code switches component order based on the preset.
- Each preset is maintained in code; avoid exposing arbitrary ordering via DB.

**Hard boundary:** if a client needs a layout that doesn't fit any preset, quote them a fork / custom-component project. Do NOT shoehorn one-off customizations into shared config.

**Effort:** 1 day per preset added.

### 2.4 Self-host PocketBase

**Problem:** PocketHost pricing starts mattering at scale.

**Fix:**
- Hetzner / DigitalOcean VPS, $5-10/mo.
- Single Go binary + systemd + nginx reverse proxy + SSL via Caddy or Certbot.
- Backups to R2 nightly.

**Effort:** half a day. Migration: export PB data, import on new instance, DNS swap, <30 min downtime.

## Stage 3 — 20+ sites (only if we get there)

Goal: fine-grained control over builds and reads; edge-cache where cheap.

### 3.1 GitHub Actions build pipeline instead of CF deploy hook

**Problem:** CF deploy hook rebuilds on a fixed trigger; no visibility into build logs except in CF UI; can't parallelize or retry cleanly.

**Fix:** PB webhook → GitHub Actions workflow → build → deploy to CF Pages via API. Parallel builds, better logs, easy rollback.

### 3.2 PocketBase read caching via Cloudflare Workers KV

**Problem:** admin traffic + build-time fetches across 50 sites can load the PB instance.

**Fix:** read-path cache at the edge. Writes invalidate specific keys. Overkill at <20 sites; consider at 50+.

### 3.3 Permissions model — per-site editor roles

**Problem:** at 20+ sites, each site may have its own content team that should only see their site.

**Fix:** PB already supports collection-level rules with `@request.auth.*`. Add a `sites` relation to the `users` collection (many-to-many); update each collection's list/update rules to require the user's assigned sites. Admin UI filters by the same rule.

**Effort:** 2-3 days once actually needed.

## What to NOT do

- Do not build a plugin / block system speculatively. Wait for repeated demand.
- Do not re-platform to a headless CMS. Migration cost dwarfs incremental pain.
- Do not switch to SSR/ISR for public sites. Static export matches this traffic profile.
- Do not split the database per tenant. PB's single-DB multi-tenant via `site` relation is correct for this scale.
- Do not custom-fork the codebase per site. Enforce the shared-config discipline; fork only as a last-resort, billable exception.

## Summary — guidance for future decisions

1. **Bias toward governance, not re-platforming.** Most scale pain comes from messy schemas and coupled deploys, not from the platform.
2. **Single-record, typed configs over EAV.** Every new collection should have proper fields from day one.
3. **One site = one deploy target.** Deploys stay isolated.
4. **Stack stays: Next.js static + CF Pages + PocketBase + R2.** Until demonstrated otherwise.
5. **Customization via config fields, not code forks.** If a client need can't be expressed as a config field, it's a fork/custom project, not a main-codebase feature.

## Decision log

- **2026-04-24** — Decided to stay on current stack rather than evaluate ISR/headless CMS alternatives. Rationale above.

## Related plans

- `2026-04-24-site-settings-consolidation.md` — prerequisite for Stage 1.2.
- `2026-03-27-db-driven-cms.md` — original CMS architecture plan.
- `2026-04-02-pocketbase-migration.md` — PocketBase adoption plan.
