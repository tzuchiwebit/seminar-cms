# Migration: PostgreSQL/Prisma/Docker to PocketBase/Cloudflare Pages

## Summary

Migrate seminar-cms from PostgreSQL + Prisma + Auth.js + Docker deployment to PocketHost (PocketBase) + Cloudflare Pages static export. UI/UX unchanged.

## Decisions

- **Database**: PocketHost (`https://academic-events.pockethost.io/`)
- **File storage**: PocketBase built-in file fields (no Sharp, no local disk)
- **Auth**: PocketBase built-in auth (no Auth.js, no domain restriction)
- **Deployment**: Cloudflare Pages with `output: "export"` (static site)
- **Data fetching**: All client-side fetch via PocketBase JS SDK (no SSR, no API routes)
- **Migration approach**: In-place refactor (preserve existing UI components and page structure)

## PocketBase Collections

10 collections to create on PocketHost dashboard:

| Collection | Type | Fields | Relations |
|---|---|---|---|
| `sites` | base | name (text), slug (text, unique), domain (text), logo (file), status (text, default:"draft") | — |
| `speakers` | base | name (text), nameCn (text), affiliation (text), title (text), bio (editor), photo (file), status (text, default:"draft"), sortOrder (number) | site → sites |
| `days` | base | dayNumber (number), date (date), titleZh (text), titleEn (text) | site → sites |
| `sessions` | base | type (text), titleZh (text), titleEn (text), subtitleZh (text), subtitleEn (text), startTime (text), duration (number), venue (text), capacity (number), sortOrder (number) | day → days |
| `session_speakers` | base | role (text, default:"speaker") | session → sessions, speaker → speakers |
| `papers` | base | titleZh (text), titleEn (text), abstract (editor), status (text, default:"draft"), sortOrder (number) | session → sessions, speaker → speakers |
| `venues` | base | name (text), nameZh (text), description (editor), descriptionEn (editor), address (text), mapUrl (url), type (text, default:"main"), capacity (number), image (file) | site → sites |
| `exhibitions` | base | titleZh (text), titleEn (text), description (editor), startDate (date), endDate (date), venue (text), image (file) | site → sites |
| `registrations` | base | name (text), email (email), phone (text), org (text), status (text, default:"pending") | site → sites |
| `site_settings` | base | key (text), value (text) | site → sites |

**Removed models** (handled by PocketBase internally):
- `users` → PocketBase built-in `users` auth collection
- `accounts`, `auth_sessions`, `verification_tokens` → PocketBase auth system
- `uploads` → files stored directly on record file fields

**Key differences from Prisma schema:**
- IDs are 15-char random strings, not auto-increment integers
- `id`, `created`, `updated` are automatic — no manual definition needed
- File fields (photo, image, logo) are PocketBase file type — upload via FormData
- Relations use PocketBase relation field type

## Data Layer

### `src/lib/pb.ts` (replaces `src/lib/prisma.ts`)

```typescript
import PocketBase from 'pocketbase';
const pb = new PocketBase('https://academic-events.pockethost.io/');
export default pb;
```

### `src/lib/queries.ts` (rewritten with PocketBase SDK)

Same exported functions, different implementation:

- `getSiteBySlug(slug)` → `pb.collection('sites').getFirstListItem('slug="..."')`
  - Then separate queries for settings, venues, exhibitions filtered by site ID
- `getSiteDays(siteId)` → `pb.collection('days').getFullList({ filter: 'site="..."', sort: 'dayNumber' })`
  - Sessions, session_speakers, papers fetched separately or via expand
- `getSiteSpeakers(siteId)` → `pb.collection('speakers').getFullList({ filter: 'site="..."', sort: 'sortOrder' })`

### API Routes — all 19 removed

Admin components call PocketBase SDK directly:
- `pb.collection('speakers').create(formData)`
- `pb.collection('speakers').update(id, formData)`
- `pb.collection('speakers').delete(id)`
- `pb.collection('speakers').getFullList({ filter: '...' })`

### File uploads

- No Sharp processing, no local disk storage
- Upload via FormData with file field:
  ```typescript
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('name', 'Speaker Name');
  pb.collection('speakers').create(formData);
  ```
- Image URLs: `pb.files.getURL(record, record.photo)`
- PocketBase supports thumb generation via URL params (e.g., `?thumb=100x100`)

## Auth

### Removed
- `src/lib/auth.ts` (NextAuth config)
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/middleware.ts` (not supported in static export anyway)

### New auth flow
- Login: `pb.collection('users').authWithPassword(email, password)`
- Token stored automatically in `pb.authStore` (localStorage)
- Auth guard: client-side check in admin layout — `pb.authStore.isValid`, redirect to login if invalid
- Account management: via PocketHost dashboard (`https://academic-events.pockethost.io/_/`)
- No domain restriction — admin manually controls who has accounts

## Next.js Config

```typescript
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};
```

## Deployment

- Connect GitHub repo to Cloudflare Pages
- Build command: `npm run build`
- Output directory: `out`
- No environment variables needed (PocketBase URL is public)

## Files to Remove

```
docker-compose.yml
Dockerfile
DEPLOY.md
nginx/                          (entire directory)
prisma/                         (entire directory)
src/lib/prisma.ts
src/lib/auth.ts
src/lib/upload.ts
src/lib/redis.ts
src/middleware.ts
src/app/api/                    (entire directory)
src/app/uploads/                (entire directory)
```

## Dependencies

**Remove:** `@prisma/client`, `prisma`, `@auth/prisma-adapter`, `next-auth`, `sharp`, `ioredis`

**Add:** `pocketbase`

## Environment Variables

**Remove:** `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `REDIS_URL`, `UPLOAD_DIR`, `MAX_FILE_SIZE`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

`.env.example` reduced to:
```
NEXT_PUBLIC_POCKETBASE_URL=https://academic-events.pockethost.io/
```

(Or hardcode the URL directly since it's public.)

## Public Pages

All pages become client-side rendered:
- `src/app/(public)/[slug]/page.tsx` — convert from Server Component to Client Component
- Data fetched on mount via PocketBase SDK
- No SEO requirement confirmed by user

## What stays unchanged

- All UI/UX components (HomePage, NavBar, Footer, SpeakerModal, admin Sidebar, TopBar, etc.)
- Page structure and routing
- Tailwind CSS styling and design tokens
- Component props interfaces (data shape may need minor adjustments for PocketBase record format)
