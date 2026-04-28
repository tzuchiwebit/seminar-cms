# Site Settings Consolidation Plan

**Status:** Not started. Reference only.
**Created:** 2026-04-24

## Why

`site_settings` is currently an EAV (entity-attribute-value) key-value table: one row per setting per site. ~31 keys × N sites = rapid row growth for a multi-site CMS.

**Pain points that scale with site count:**
- Schema drift — each site has whatever subset of keys has been written; no enforcement that all sites share the same fields.
- Seeding a new site requires N INSERTs (one per default key); currently lazy-created on first write, so "does site X have setting Y?" is ambiguous.
- PocketHost admin UI shows hundreds of rows across sites — hard to audit.
- Every value is a string — booleans ("true"/"false"), JSON, dates all parsed manually at read sites; typos + silent drops are easy.
- `loadSettings(siteId)` does a `getFullList(filter: site="X")` that scans ~31 rows instead of a single-row lookup.
- No TypeScript type safety — `settings.og_titel` (typo) silently returns `undefined`.

**When to execute:** Before sites count grows past ~5. Currently 1-2 sites — cheap to migrate now, expensive later.

## Target schema: `site_config` collection

One record per site. Replaces `site_settings` entirely.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | auto | PB standard |
| `site` | Relation → sites | **unique, required** (1:1 with site) |
| `site_language` | Select | options: `en`, `zh`, `both`; default `both` |
| `site_name_en` | Text | |
| `favicon` | File (single) | mime: image/png,svg,ico |
| `og_title` | Text | |
| `og_title_en` | Text | |
| `og_description` | Text (2000) | |
| `og_description_en` | Text (2000) | |
| `og_image` | File (single) | mime: image/jpeg,png,webp |
| `banner_image` | File (single) | mime: image/jpeg,png,webp |
| `banner_image_mobile` | File (single) | same |
| `description_headline` | Text | |
| `description_headline_en` | Text | |
| `description_body` | Text (5000) | |
| `description_body_en` | Text (5000) | |
| `description_highlights` | JSON | array of `{ icon, label, labelEn }` |
| `tour_header` | Text | |
| `tour_header_en` | Text | |
| `tour_groups` | JSON | array of `{ number, title, titleEn, sub, subEn, tag, tagEn }` |
| `speakers_subtitle` | Text | |
| `speakers_subtitle_en` | Text | |
| `speakers_see_more` | Bool | default `true` |
| `section_description_visible` | Bool | default `true` |
| `section_tour_visible` | Bool | default `true` |
| `section_programme_visible` | Bool | default `true` |
| `section_venues_visible` | Bool | default `true` |
| `section_speakers_visible` | Bool | default `true` |
| `eventStartDate` | Date | |
| `eventEndDate` | Date | |
| `registration_google_form_url` | URL | |
| `deploy_hook_url` | URL | (Cloudflare Pages webhook) |
| `copyright` | Text | (was fallback-only in EAV; make it a real field) |
| `last_updated` | Date (auto-update on save) | |

### API rules
- `List/View`: public read (`@request.auth.id != ""` or fully public — match current `site_settings`)
- `Create/Update/Delete`: authenticated admin only

## Migration strategy

One-off script, runs once against the production PocketHost instance. Non-destructive to old data (keep `site_settings` around until verified).

### Script outline (`scripts/migrate-site-settings.mjs`)

```js
import PocketBase from 'pocketbase';
const pb = new PocketBase(process.env.PB_URL);
await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PW);

const sites = await pb.collection('sites').getFullList();

for (const site of sites) {
  const rows = await pb.collection('site_settings').getFullList({ filter: `site="${site.id}"` });
  const kv = Object.fromEntries(rows.map(r => [r.key, r.value]));

  // Build typed record
  const record = {
    site: site.id,
    site_language: kv.site_language || 'both',
    site_name_en: kv.site_name_en || '',
    og_title: kv.og_title || '',
    og_title_en: kv.og_title_en || '',
    og_description: kv.og_description || '',
    og_description_en: kv.og_description_en || '',
    description_headline: kv.description_headline || '',
    description_headline_en: kv.description_headline_en || '',
    description_body: kv.description_body || '',
    description_body_en: kv.description_body_en || '',
    description_highlights: safeJSON(kv.description_highlights, []),
    tour_header: kv.tour_header || '',
    tour_header_en: kv.tour_header_en || '',
    tour_groups: safeJSON(kv.tour_groups, []),
    speakers_subtitle: kv.speakers_subtitle || '',
    speakers_subtitle_en: kv.speakers_subtitle_en || '',
    speakers_see_more: kv.speakers_see_more !== 'false',
    section_description_visible: kv.section_description_visible !== 'false',
    section_tour_visible: kv.section_tour_visible !== 'false',
    section_programme_visible: kv.section_programme_visible !== 'false',
    section_venues_visible: kv.section_venues_visible !== 'false',
    section_speakers_visible: kv.section_speakers_visible !== 'false',
    eventStartDate: kv.eventStartDate || null,
    eventEndDate: kv.eventEndDate || null,
    registration_google_form_url: kv.registration_google_form_url || '',
    deploy_hook_url: kv.deploy_hook_url || '',
    copyright: kv.copyright || '',
  };

  // File fields: value in EAV holds filename; need to fetch the file blob and re-upload.
  // For og_image / favicon / banner_image / banner_image_mobile:
  //   - If current storage was as URL string (unlikely) → insert as URL-typed text field instead
  //   - If stored as filename on site_settings row → fetch the blob, pass to FormData on new record
  // In practice: check with `console.log(rows.find(r => r.key === 'favicon'))` — if it has a non-empty
  // `value` that looks like a URL, these were stored as URLs and we just copy the string. If the site_settings
  // row itself has a file field attached (not typical for EAV), we'd need to download + re-attach.

  // Save
  await pb.collection('site_config').create(record);
  console.log(`Migrated ${site.slug}`);
}

function safeJSON(raw, fallback) {
  if (!raw) return fallback;
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return fallback; }
}
```

**Gotcha to verify before running:**
- File-typed settings (`favicon`, `og_image`, `banner_image`, `banner_image_mobile`): are these currently stored as (a) URL strings in the `value` field, (b) actual uploaded files attached to the site_settings row, or (c) uploaded to a different collection and referenced by filename? Check a few records in PocketHost admin before writing migration. If (a), schema for those fields should be **URL** not **File**. If (b), script needs to download + re-upload.
- `description_highlights` / `tour_groups` may be stored as raw JSON strings — `safeJSON` handles both cases.

### Dry-run first
Run locally against a staging copy of the PB instance before touching prod. Verify a site's rendered output matches before/after.

## Code refactor

### New data layer

Replace `loadSettings` / `upsertSetting` in `src/lib/pb-queries.ts` (and the server twin in `src/lib/pb-server.ts`):

```ts
// Before
export async function loadSettings(siteId: string): Promise<Record<string, string>> {
  const records = await pb.collection('site_settings').getFullList({ filter: `site="${siteId}"` });
  return Object.fromEntries(records.map(r => [r.key, r.value]));
}

// After
export interface SiteConfig {
  id: string;
  site: string;
  site_language: 'en' | 'zh' | 'both';
  og_title: string;
  og_title_en: string;
  // ... all fields typed
  speakers_see_more: boolean;
  section_description_visible: boolean;
  // ...
  description_highlights: Array<{ icon: string; label: string; labelEn: string }>;
  tour_groups: Array<{ number: string; title: string; titleEn: string; sub: string; subEn: string; tag: string; tagEn: string }>;
}

export async function loadSiteConfig(siteId: string): Promise<SiteConfig> {
  return await pb.collection('site_config').getFirstListItem(`site="${siteId}"`);
}

export async function updateSiteConfig(configId: string, patch: Partial<SiteConfig>): Promise<SiteConfig> {
  return await pb.collection('site_config').update(configId, { ...patch, last_updated: new Date().toISOString() });
}
```

### Call sites to update

Every `upsertSetting(siteId, "key", value)` call becomes `updateSiteConfig(configId, { key: value })`. Need to have `configId` in scope — typically loaded alongside the form state on mount.

Search for replacements:
- `src/app/admin/SiteDashboardClient.tsx` — many upsertSetting calls across panels. Batch updates (save-on-submit) become more natural with typed fields.
- `src/app/(public)/[[...slug]]/HomePage.tsx` — reads via `settings.foo` become `config.foo` (typed).
- `src/app/(public)/[[...slug]]/page.tsx` — OG metadata reads.
- `src/lib/pb-server.ts` — build-time fetch for static export.

### Batch save opportunity

Currently each field save = 1 request. With single record, admin can edit many fields + save once:

```ts
// Before: 5 round-trips
await upsertSetting(siteId, 'og_title', form.og_title);
await upsertSetting(siteId, 'og_description', form.og_description);
// ...

// After: 1 round-trip
await updateSiteConfig(configId, {
  og_title: form.og_title,
  og_description: form.og_description,
  og_image: form.og_image,
  og_title_en: form.og_title_en,
  og_description_en: form.og_description_en,
});
```

Bonus: no more `touchLastUpdated` helper — last_updated auto-updates on save.

## Verification

Before deleting old `site_settings`:
1. Run migration on staging instance, deploy code with new reads, verify all pages render identically.
2. Spot-check admin — edit each section, save, verify persists and re-renders correctly.
3. Verify build-time static export picks up values from `site_config`.
4. Verify deploy hook still fires (check `deploy_hook_url` field).
5. Let it sit on prod for 1-2 weeks reading from both (feature flag) before deleting the old collection.

## Rollback

Old `site_settings` collection stays intact during migration. If issues post-deploy:
- Revert code to previous commit (reads from `site_settings` again).
- Old data is still there — no data loss.
- Delete the new `site_config` collection, retry later.

## Estimated effort

- Schema creation in PocketHost admin: 20 min (clicking through field creation × 32 fields)
- Migration script: 30 min write + 30 min test on staging
- Code refactor: 2-3 hours (many read sites, many upsertSetting calls in admin)
- Verification: 1 hour spot-checking all sections
- **Total: ~4-5 hours**

## Out of scope for this plan
- Migrating other EAV-like patterns if they exist elsewhere.
- Changing the `sites` collection schema — only `site_settings` is consolidated.
- Renaming keys — keep same names in the new schema for minimal code diff.
