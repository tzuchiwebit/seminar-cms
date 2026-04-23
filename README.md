# Seminar CMS

慈濟全球共善學思會 — A multi-site event management system for conferences/symposiums with bilingual (Chinese/English) support.

## Tech Stack

- **Framework**: Next.js 15 (App Router, static export)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4
- **Backend**: PocketBase JS SDK (hosted on PocketHost)
- **Hosting**: Cloudflare Pages (static)
- **Fonts**: Inter, Noto Serif TC, Noto Sans TC

## Getting Started

```bash
npm install
npm run dev              # Dev server → http://localhost:3000
npm run build            # Production build (static export → out/)
```

## Architecture

### Public Site (Pre-built Static HTML)

The public site (`/symposium`) is **pre-built at deploy time** for instant page load (< 1 second). During `npm run build`, all data is fetched from PocketBase and embedded directly into the HTML files.

- `src/app/(public)/[[...slug]]/page.tsx` — Server-side data fetching at build time
- `src/app/(public)/[[...slug]]/PublicPageClient.tsx` — Client component, uses preloaded data (falls back to client fetch in dev mode)
- `src/app/(public)/[[...slug]]/HomePage.tsx` — Main page UI
- `src/lib/pb-server.ts` — Server-side PocketBase fetching for build

### Admin CMS

The admin panel (`/admin`) is fully client-side rendered with real-time PocketBase data.

- `src/app/admin/page.tsx` — Admin dashboard (site list)
- `src/app/admin/SiteDashboardClient.tsx` — Site CMS editor (all panels)
- `src/hooks/useAuth.ts` — PocketBase authentication

### Data Layer

- `src/lib/pb.ts` — PocketBase client singleton (client-side)
- `src/lib/pb-server.ts` — PocketBase instance for build-time fetching
- `src/lib/pb-queries.ts` — Reusable query functions

## PocketBase Collections

| Collection | Description |
|---|---|
| `sites` | Site configuration (slug, name, status) |
| `speakers` | Speaker profiles with bilingual fields |
| `days` | Event days (sorted by date) |
| `sessions` | Schedule sessions per day |
| `session_speakers` | M-to-M: session ↔ speaker (with role: speaker/moderator/discussant) |
| `papers` | Paper titles per session per speaker |
| `venues` | Venue locations with addresses |
| `exhibitions` | Exhibition info |
| `registrations` | Registration records |
| `site_settings` | Key-value settings per site |

### Required PocketBase Fields

#### speakers
| Field | Type | Notes |
|---|---|---|
| `name` | Text | English name (required) |
| `nameCn` | Text | Chinese name (optional) |
| `affiliation` | Text | EN |
| `affiliationZh` | Text | ZH |
| `title_field` | Text | Job title EN (not `title` — PB reserved) |
| `titleZh` | Text | Job title ZH |
| `talkTitle` | Text | JSON array `[{"en":"...","zh":"..."}]` |
| `bio` | Text | Biography |
| `photo` | File | Speaker photo |
| `status` | Text | `pending` or `confirmed` |
| `last_updated` | Date | Set on create/edit |
| `site` | Relation | → sites |

#### sessions
| Field | Type | Notes |
|---|---|---|
| `type` | Text | keynote, paper_session, roundtable, break, etc. |
| `titleEn` / `titleZh` | Text | Required (auto-filled for non-content types) |
| `subtitleEn` / `subtitleZh` | Text | Optional |
| `startTime` | Text | Format: `HH:MM` |
| `duration` | Number | Minutes |
| `venue` | Text | Location name |
| `groupPhoto` | Boolean | Shows 大合照 badge |
| `sortOrder` | Number | Display order |
| `day` | Relation | → days |

#### site_settings (key-value)
| Key | Description |
|---|---|
| `site_language` | `en`, `zh`, or `both` |
| `deploy_hook_url` | Cloudflare Pages deploy hook URL |
| `registration_google_form_url` | Registration form link |
| `section_*_visible` | Toggle sections on/off (e.g. `section_tour_visible`) |
| `section_highlights_visible` | Toggle highlights cards |
| `description_headline` / `_en` | About section headline |
| `description_body` / `_en` | About section body text |
| `description_highlights` | JSON array of highlight cards |
| `banner_image` / `_mobile` | Hero banner images |
| `favicon` | Site favicon URL |
| `og_title` / `_en` | Open Graph title |
| `og_description` / `_en` | Open Graph description |

## Deployment

### How It Works

1. Admin edits content in CMS → saves to PocketBase
2. Admin clicks **「重新發布」** in 設定 section
3. This triggers a Cloudflare Pages deploy hook
4. Cloudflare runs `npm run build` → fetches latest data from PocketBase → generates static HTML
5. Public site updates with new data (~1-2 minutes)

### Setup Deploy Hook (Required)

The deploy hook allows the admin CMS to trigger a Cloudflare Pages rebuild.

**Cloudflare Dashboard:**
1. Go to **Cloudflare Dashboard** → **Pages** → your project
2. **Settings** → **Builds & deployments** → **Deploy hooks**
3. Click **"Add deploy hook"** → Name: `CMS Publish`, Branch: `master`
4. Copy the generated URL

**PocketBase:**
1. Go to PocketBase admin → `site_settings` collection
2. Create new record:
   - `site`: (select your site)
   - `key`: `deploy_hook_url`
   - `value`: (paste the Cloudflare URL)

### Build Settings (Cloudflare Pages)

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `out` |
| Node version | 18+ |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_POCKETBASE_URL` | `https://academic-events.pockethost.io/` | PocketBase API URL |

## Admin CMS Features

### Sections
- **網站外觀** — Favicon, banner, OG meta (auto-save)
- **活動簡介** — Headline, body text, highlights cards (auto-save)
- **導覽梯次** — Tour group info, descriptions with auto-link URLs (auto-save)
- **議程** — Days, sessions, speakers, papers (CRUD with popups)
- **場地** — Venue locations with Google Maps links
- **講者** — Speaker profiles, bilingual, multiple talk titles, sortable table
- **報名設定** — Google Form registration URL
- **樣式設定** — Color customization
- **設定** — Site settings, language, deploy/publish

### Key Behaviors
- **Session type auto-fill**: Selecting 茶敘/報到/晚宴 etc. auto-fills titles
- **Group photo toggle**: Checkbox on sessions, shows badge on public site
- **Speaker talk title auto-fill**: When adding speaker to session, paper title pre-fills from speaker's talk titles
- **Cascade delete**: Deleting a day deletes all its sessions, session_speakers, and papers
- **Days sorted by date**: Day numbering is automatic based on date order
- **Validation**: Required fields highlighted red, popup stays open on error
- **Toast notifications**: Green (success), amber (warning), red (error) with animated borders
- **Save button animation**: Spinner during save operations
- **Delete overlay**: Shows progress during deletion

## Design Tokens

| Token | Value |
|---|---|
| Cream | `#F5F1EB` |
| Dark | `#1A1816` |
| Gold | `#9B7B2F` |
| Green | `#3D5A3E` |
| Sidebar | `#3D3A36` |
| Border | `#E5E0D8` |
| Muted | `#5A554B` |
