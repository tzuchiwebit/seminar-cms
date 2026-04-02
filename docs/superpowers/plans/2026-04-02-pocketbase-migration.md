# PocketBase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate seminar-cms from PostgreSQL/Prisma/Auth.js/Docker to PocketHost (PocketBase) + Cloudflare Pages static export, keeping all UI unchanged.

**Architecture:** Replace Prisma ORM with PocketBase JS SDK for all data operations. Convert from SSR to fully client-side rendered static site. Replace Auth.js with PocketBase built-in auth. Replace Sharp/disk file uploads with PocketBase file fields. Remove Docker deployment, target Cloudflare Pages.

**Tech Stack:** Next.js 15 (static export), PocketBase JS SDK, Tailwind CSS v4, Cloudflare Pages

**Spec:** `docs/superpowers/specs/2026-04-02-pocketbase-migration-design.md`

---

## File Structure

### Files to Create
- `src/lib/pb.ts` — PocketBase client singleton
- `src/lib/pb-queries.ts` — Reusable query functions (replaces `queries.ts`)
- `src/hooks/useAuth.ts` — Auth state hook (replaces `useSession`)

### Files to Modify
- `next.config.ts` — Change to `output: "export"`, remove `sharp` config
- `package.json` — Swap dependencies
- `src/app/layout.tsx` — Remove any server-only imports
- `src/app/(public)/page.tsx` — Client-side redirect (no `redirect()` from next/navigation in static)
- `src/app/(public)/[slug]/page.tsx` — Convert Server Component → Client Component with PocketBase fetch
- `src/app/(public)/[slug]/layout.tsx` — Remove `generateMetadata` server function, convert to client
- `src/app/admin/layout.tsx` — Replace `SessionProvider` with PocketBase auth check
- `src/app/admin/login/page.tsx` — Replace NextAuth `signIn` with PocketBase `authWithPassword`
- `src/app/admin/page.tsx` — Replace all `fetch("/api/...")` calls with PocketBase SDK
- `src/app/admin/[site]/page.tsx` — Replace all `fetch("/api/...")` calls with PocketBase SDK (2542 lines, ~45 fetch calls)
- `src/components/admin/Sidebar.tsx` — Replace `useSession`/`signOut` with PocketBase auth
- `.env.example` — Simplify to PocketBase URL only

### Files to Delete
- `src/lib/prisma.ts`
- `src/lib/auth.ts`
- `src/lib/upload.ts`
- `src/lib/redis.ts`
- `src/lib/queries.ts`
- `src/middleware.ts`
- `src/app/api/` (entire directory — 19 route files)
- `src/app/uploads/` (if exists)
- `prisma/` (entire directory)
- `docker-compose.yml`
- `Dockerfile`
- `DEPLOY.md`
- `nginx/` (entire directory)

---

## Task 1: Set Up PocketBase Collections on PocketHost

**Context:** Before any code changes, the PocketBase backend must exist. Collections are created via the PocketHost admin dashboard at `https://academic-events.pockethost.io/_/`.

- [ ] **Step 1: Log in to PocketHost admin dashboard**

Open `https://academic-events.pockethost.io/_/` and log in.

- [ ] **Step 2: Create `sites` collection**

Type: Base collection

Fields:
| Field | Type | Options |
|---|---|---|
| `name` | Text | Required |
| `slug` | Text | Required, Unique |
| `domain` | Text | |
| `logo` | File | Max 1 file, mime: image/* |
| `status` | Text | Default: "draft" |

- [ ] **Step 3: Create `speakers` collection**

Type: Base collection

Fields:
| Field | Type | Options |
|---|---|---|
| `site` | Relation | → sites, Required |
| `name` | Text | Required |
| `nameCn` | Text | |
| `affiliation` | Text | |
| `title` | Text | |
| `bio` | Editor | |
| `photo` | File | Max 1 file, mime: image/* |
| `status` | Text | Default: "draft" |
| `sortOrder` | Number | Default: 0 |

- [ ] **Step 4: Create `days` collection**

Type: Base collection

Fields:
| Field | Type | Options |
|---|---|---|
| `site` | Relation | → sites, Required |
| `dayNumber` | Number | Required |
| `date` | Date | Required |
| `titleZh` | Text | Required |
| `titleEn` | Text | |

Unique index on `site` + `dayNumber`.

- [ ] **Step 5: Create `sessions` collection**

Type: Base collection

Fields:
| Field | Type | Options |
|---|---|---|
| `day` | Relation | → days, Required |
| `type` | Text | Required |
| `titleZh` | Text | Required |
| `titleEn` | Text | |
| `subtitleZh` | Text | |
| `subtitleEn` | Text | |
| `startTime` | Text | |
| `duration` | Number | |
| `venue` | Text | |
| `capacity` | Number | |
| `sortOrder` | Number | Default: 0 |

- [ ] **Step 6: Create `session_speakers` collection**

Type: Base collection

Fields:
| Field | Type | Options |
|---|---|---|
| `session` | Relation | → sessions, Required |
| `speaker` | Relation | → speakers, Required |
| `role` | Text | Default: "speaker" |

Unique index on `session` + `speaker`.

- [ ] **Step 7: Create `papers` collection**

Type: Base collection

Fields:
| Field | Type | Options |
|---|---|---|
| `session` | Relation | → sessions, Required |
| `speaker` | Relation | → speakers |
| `titleZh` | Text | Required |
| `titleEn` | Text | |
| `abstract` | Editor | |
| `status` | Text | Default: "draft" |
| `sortOrder` | Number | Default: 0 |

- [ ] **Step 8: Create `venues` collection**

Type: Base collection

Fields:
| Field | Type | Options |
|---|---|---|
| `site` | Relation | → sites, Required |
| `name` | Text | Required |
| `nameZh` | Text | |
| `description` | Editor | |
| `descriptionEn` | Editor | |
| `address` | Text | |
| `mapUrl` | URL | |
| `type` | Text | Default: "main" |
| `capacity` | Number | |
| `image` | File | Max 1 file, mime: image/* |

- [ ] **Step 9: Create `exhibitions` collection**

Type: Base collection

Fields:
| Field | Type | Options |
|---|---|---|
| `site` | Relation | → sites, Required |
| `titleZh` | Text | Required |
| `titleEn` | Text | |
| `description` | Editor | |
| `startDate` | Date | |
| `endDate` | Date | |
| `venue` | Text | |
| `image` | File | Max 1 file, mime: image/* |

- [ ] **Step 10: Create `registrations` collection**

Type: Base collection

Fields:
| Field | Type | Options |
|---|---|---|
| `site` | Relation | → sites, Required |
| `name` | Text | Required |
| `email` | Email | Required |
| `phone` | Text | |
| `org` | Text | |
| `status` | Text | Default: "pending" |

- [ ] **Step 11: Create `site_settings` collection**

Type: Base collection

Fields:
| Field | Type | Options |
|---|---|---|
| `site` | Relation | → sites, Required |
| `key` | Text | Required |
| `value` | Text | |

Unique index on `site` + `key`.

- [ ] **Step 12: Create admin user**

Go to the PocketBase `users` auth collection (built-in). Create a user with email and password for admin access. No domain restriction needed.

- [ ] **Step 13: Configure API rules**

For all collections, set API rules:
- **List/View**: Leave empty (public read access for all collections)
- **Create/Update/Delete**: `@request.auth.id != ""` (authenticated users only)

For `registrations` collection specifically:
- **Create**: Leave empty (public can submit registrations)
- **Update/Delete**: `@request.auth.id != ""` (authenticated users only)

---

## Task 2: Swap Dependencies and Config

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts`
- Modify: `.env.example`

- [ ] **Step 1: Install PocketBase SDK, remove old dependencies**

```bash
cd /Users/kaellim/Desktop/projects/seminar
npm install pocketbase
npm uninstall @prisma/client @auth/prisma-adapter next-auth sharp ioredis
npm uninstall -D prisma
```

- [ ] **Step 2: Update `next.config.ts`**

Replace entire file with:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

- [ ] **Step 3: Update `.env.example`**

Replace entire file with:

```
NEXT_PUBLIC_POCKETBASE_URL=https://academic-events.pockethost.io/
```

- [ ] **Step 4: Update `package.json` scripts**

Remove these scripts: `db:generate`, `db:push`, `db:migrate`, `db:seed`, `db:studio`, `docker:up`, `docker:down`, `docker:logs`, `docker:seed`.

Keep only: `dev`, `build`, `start`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json next.config.ts .env.example
git commit -m "chore: swap deps — pocketbase in, prisma/nextauth/sharp/redis out"
```

---

## Task 3: Create PocketBase Client and Query Layer

**Files:**
- Create: `src/lib/pb.ts`
- Create: `src/lib/pb-queries.ts`
- Delete: `src/lib/prisma.ts`
- Delete: `src/lib/queries.ts`
- Delete: `src/lib/redis.ts`
- Delete: `src/lib/upload.ts`

- [ ] **Step 1: Create `src/lib/pb.ts`**

```typescript
import PocketBase from "pocketbase";

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://academic-events.pockethost.io/"
);

export default pb;
```

- [ ] **Step 2: Create `src/lib/pb-queries.ts`**

```typescript
import pb from "./pb";

export async function getSiteBySlug(slug: string) {
  return pb.collection("sites").getFirstListItem(`slug="${slug}"`);
}

export async function getSiteSettings(siteId: string) {
  const records = await pb.collection("site_settings").getFullList({
    filter: `site="${siteId}"`,
  });
  const map: Record<string, string> = {};
  for (const r of records) map[r.key] = r.value;
  return map;
}

export async function getSiteDays(siteId: string) {
  const days = await pb.collection("days").getFullList({
    filter: `site="${siteId}"`,
    sort: "dayNumber",
  });

  const dayIds = days.map((d) => d.id);
  if (dayIds.length === 0) return [];

  const sessions = await pb.collection("sessions").getFullList({
    filter: dayIds.map((id) => `day="${id}"`).join(" || "),
    sort: "sortOrder",
  });

  const sessionIds = sessions.map((s) => s.id);

  let sessionSpeakers: any[] = [];
  let papers: any[] = [];

  if (sessionIds.length > 0) {
    const ssFilter = sessionIds.map((id) => `session="${id}"`).join(" || ");
    sessionSpeakers = await pb.collection("session_speakers").getFullList({
      filter: ssFilter,
      expand: "speaker",
    });
    papers = await pb.collection("papers").getFullList({
      filter: ssFilter,
      sort: "sortOrder",
      expand: "speaker",
    });
  }

  // Assemble nested structure to match old Prisma shape
  return days.map((day) => ({
    ...day,
    sessions: sessions
      .filter((s) => s.day === day.id)
      .map((s) => ({
        ...s,
        sessionSpeakers: sessionSpeakers
          .filter((ss) => ss.session === s.id)
          .map((ss) => ({
            ...ss,
            speaker: ss.expand?.speaker || null,
          })),
        papers: papers
          .filter((p) => p.session === s.id)
          .map((p) => ({
            ...p,
            speaker: p.expand?.speaker || null,
          })),
      })),
  }));
}

export async function getSiteSpeakers(siteId: string) {
  const speakers = await pb.collection("speakers").getFullList({
    filter: `site="${siteId}"`,
    sort: "sortOrder",
  });

  const speakerIds = speakers.map((s) => s.id);
  if (speakerIds.length === 0) return speakers;

  const ssFilter = speakerIds.map((id) => `speaker="${id}"`).join(" || ");
  const sessionSpeakers = await pb.collection("session_speakers").getFullList({
    filter: ssFilter,
    expand: "session,session.day",
  });
  const papers = await pb.collection("papers").getFullList({
    filter: speakerIds.map((id) => `speaker="${id}"`).join(" || "),
  });

  return speakers.map((spk) => ({
    ...spk,
    sessionSpeakers: sessionSpeakers
      .filter((ss) => ss.speaker === spk.id)
      .map((ss) => ({
        ...ss,
        session: ss.expand?.session
          ? { ...ss.expand.session, day: ss.expand["session.day"] || ss.expand?.session?.expand?.day || null }
          : null,
      })),
    papers: papers.filter((p) => p.speaker === spk.id),
  }));
}

export async function getSiteVenues(siteId: string) {
  return pb.collection("venues").getFullList({
    filter: `site="${siteId}"`,
    sort: "created",
  });
}

export async function getSiteExhibitions(siteId: string) {
  return pb.collection("exhibitions").getFullList({
    filter: `site="${siteId}"`,
  });
}

export async function getSiteRegistrations(siteId: string) {
  return pb.collection("registrations").getFullList({
    filter: `site="${siteId}"`,
    sort: "-created",
  });
}

/** Get file URL from a PocketBase record */
export function getFileUrl(record: any, filename: string) {
  if (!filename) return "";
  return pb.files.getURL(record, filename);
}
```

- [ ] **Step 3: Delete old lib files**

```bash
rm src/lib/prisma.ts src/lib/queries.ts src/lib/redis.ts src/lib/upload.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/
git commit -m "feat: add PocketBase client and query layer, remove Prisma/Redis/Upload libs"
```

---

## Task 4: Replace Auth System

**Files:**
- Create: `src/hooks/useAuth.ts`
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/app/admin/login/page.tsx`
- Modify: `src/components/admin/Sidebar.tsx`
- Delete: `src/lib/auth.ts`
- Delete: `src/middleware.ts`
- Delete: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create `src/hooks/useAuth.ts`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pb";

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const [user, setUser] = useState(pb.authStore.record);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = pb.authStore.onChange((_token, record) => {
      setUser(record);
    });

    if (requireAuth && !pb.authStore.isValid) {
      router.replace("/admin/login");
    }
    setLoading(false);

    return () => unsub();
  }, [requireAuth, router]);

  const signOut = () => {
    pb.authStore.clear();
    router.replace("/admin/login");
  };

  return { user, loading, isValid: pb.authStore.isValid, signOut };
}
```

- [ ] **Step 2: Rewrite `src/app/admin/layout.tsx`**

Replace entire file:

```typescript
"use client";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

No more `SessionProvider` — PocketBase auth is handled per-component via `useAuth`.

- [ ] **Step 3: Rewrite `src/app/admin/login/page.tsx`**

Replace entire file:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pb";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (pb.authStore.isValid) {
      router.replace("/admin");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await pb.collection("users").authWithPassword(email, password);
      router.replace("/admin");
    } catch {
      setErrorMsg("帳號或密碼錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-[#1A1816] text-[28px] font-bold">
            慈濟全球共善學思會
          </h1>
          <p className="text-[#5A554B] text-[14px] mt-2">CMS 管理後台</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E5E0D8]">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px] text-center">
              {errorMsg}
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[13px] text-[#5A554B] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2.5 border border-[#E5E0D8] rounded-lg text-[14px] text-[#1A1816] bg-white focus:outline-none focus:border-[#9B7B2F] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#5A554B] mb-1.5">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 border border-[#E5E0D8] rounded-lg text-[14px] text-[#1A1816] bg-white focus:outline-none focus:border-[#9B7B2F] transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#9B7B2F] text-white rounded-lg text-[14px] font-medium hover:bg-[#836829] transition-colors disabled:opacity-50"
            >
              {loading ? "登入中..." : "登入"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update `src/components/admin/Sidebar.tsx`**

Replace `useSession`/`signOut` imports and usage. Change the top of the file:

Replace:
```typescript
import { useSession, signOut } from "next-auth/react";
```
With:
```typescript
import { useAuth } from "@/hooks/useAuth";
```

Replace inside `Sidebar()`:
```typescript
const { data: session } = useSession();
```
With:
```typescript
const { user, signOut } = useAuth();
```

Replace in the user section (bottom of sidebar):
- `session?.user?.image` → `user?.avatar ? pb.files.getURL(user, user.avatar) : null` (add `import pb from "@/lib/pb"` at top)
- `session?.user?.name` → `user?.name`
- `session?.user?.email` → `user?.email`
- `signOut({ callbackUrl: "/admin/login" })` → `signOut()`

- [ ] **Step 5: Delete old auth files**

```bash
rm src/lib/auth.ts src/middleware.ts
rm -rf src/app/api/auth
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/ src/app/admin/ src/components/admin/Sidebar.tsx
git add -u  # stages deletions
git commit -m "feat: replace Auth.js with PocketBase auth"
```

---

## Task 5: Convert Public Pages to Client-Side Rendering

**Files:**
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/app/(public)/[slug]/page.tsx`
- Modify: `src/app/(public)/[slug]/layout.tsx`

- [ ] **Step 1: Update `src/app/(public)/page.tsx`**

The `redirect()` function from `next/navigation` works in static export as a client redirect. No change needed if it works. If not, replace with:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/symposium");
  }, [router]);
  return null;
}
```

- [ ] **Step 2: Convert `src/app/(public)/[slug]/page.tsx` to client component**

Replace entire file:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getSiteBySlug, getSiteDays, getSiteSpeakers, getSiteSettings, getSiteVenues, getSiteExhibitions } from "@/lib/pb-queries";
import HomePage from "./HomePage";

export default function Page() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const site = await getSiteBySlug(slug);
        const [days, speakers, settings, venues, exhibitions] = await Promise.all([
          getSiteDays(site.id),
          getSiteSpeakers(site.id),
          getSiteSettings(site.id),
          getSiteVenues(site.id),
          getSiteExhibitions(site.id),
        ]);
        setData({ site, days, speakers, settings, venues, exhibitions });
      } catch (err) {
        console.error("Failed to load site:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#9B7B2F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="text-[#5A554B]">找不到此網站</p>
      </div>
    );
  }

  return (
    <HomePage
      days={data.days}
      speakers={data.speakers}
      settings={data.settings}
      siteName={data.site.name}
      slug={slug}
      exhibitions={data.exhibitions}
      venues={data.venues}
    />
  );
}
```

- [ ] **Step 3: Simplify `src/app/(public)/[slug]/layout.tsx`**

Remove `generateMetadata` (requires server). Replace entire file:

```typescript
export default function SlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-screen">{children}</main>;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(public\)/
git commit -m "feat: convert public pages to client-side rendering with PocketBase"
```

---

## Task 6: Migrate Admin Dashboard (`src/app/admin/page.tsx`)

**Files:**
- Modify: `src/app/admin/page.tsx`

This file uses `useSession`/`signOut` from NextAuth, and fetches from `/api/sites`, `/api/users`, `/api/sites/${id}/settings`. All need to change to PocketBase SDK.

- [ ] **Step 1: Replace imports**

Replace:
```typescript
import { useSession, signOut } from "next-auth/react";
```
With:
```typescript
import { useAuth } from "@/hooks/useAuth";
import pb from "@/lib/pb";
```

- [ ] **Step 2: Replace `useSession` usage**

In `AllWebsitesPage()`, replace:
```typescript
const { data: session } = useSession();
```
With:
```typescript
const { user, signOut } = useAuth();
```

Update any `session?.user` references to use `user` directly.

- [ ] **Step 3: Update `Site` type**

The Prisma `_count` field doesn't exist in PocketBase. Change the type and compute counts manually.

Replace the `Site` type:
```typescript
type Site = {
  id: string;
  name: string;
  slug: string;
  domain: string;
  status: string;
  created: string;
  updated: string;
  _count: {
    speakers: number;
    days: number;
    registrations: number;
  };
};
```

Note: `id` is now `string`, timestamps are `created`/`updated` (PocketBase convention).

- [ ] **Step 4: Replace `fetchSites` function**

Replace the fetch call with PocketBase SDK:

```typescript
const fetchSites = useCallback(async () => {
  try {
    const records = await pb.collection("sites").getFullList({ sort: "-created" });
    const sitesWithCounts = await Promise.all(
      records.map(async (site) => {
        const [speakers, days, registrations] = await Promise.all([
          pb.collection("speakers").getList(1, 1, { filter: `site="${site.id}"` }),
          pb.collection("days").getList(1, 1, { filter: `site="${site.id}"` }),
          pb.collection("registrations").getList(1, 1, { filter: `site="${site.id}"` }),
        ]);
        return {
          ...site,
          _count: {
            speakers: speakers.totalItems,
            days: days.totalItems,
            registrations: registrations.totalItems,
          },
        };
      })
    );
    setSites(sitesWithCounts.length > 0 ? sitesWithCounts : fallbackSites);
  } catch {
    setSites(fallbackSites);
  } finally {
    setLoading(false);
  }
}, []);
```

- [ ] **Step 5: Replace user fetch**

Replace:
```typescript
fetch("/api/users").then(r => r.ok ? r.json() : []).then(setUsers).catch(() => {});
```
With:
```typescript
pb.collection("users").getFullList().then(setUsers).catch(() => {});
```

Update `UserItem` type: `id` is `string`, add `avatar` field (PocketBase uses `avatar` instead of `image`), `emailVerified` is `verified` (boolean).

- [ ] **Step 6: Replace `handleCreate`**

Replace `fetch("/api/sites", { method: "POST", ... })` with:
```typescript
const site = await pb.collection("sites").create({
  name: formName,
  slug: formSlug,
  status: formStatus,
});
```

Replace settings creation `fetch(\`/api/sites/${site.id}/settings\`, ...)` with:
```typescript
for (const s of settingsPairs) {
  await pb.collection("site_settings").create({
    site: site.id,
    key: s.key,
    value: s.value,
  });
}
```

- [ ] **Step 7: Replace `handleDelete`**

Replace:
```typescript
const res = await fetch(`/api/sites/${site.id}`, { method: "DELETE" });
```
With:
```typescript
await pb.collection("sites").delete(site.id);
```

- [ ] **Step 8: Update `fallbackSites`**

Change `id: 0` to `id: "0"`, `createdAt` to `created`, `updatedAt` to `updated`.

- [ ] **Step 9: Update `timeAgo` function**

Change parameter to accept PocketBase date format (same ISO string, should work as-is). Verify it still references `site.created` / `site.updated` instead of `site.createdAt` / `site.updatedAt`.

- [ ] **Step 10: Update `signOut` calls**

Replace any `signOut({ callbackUrl: "/admin/login" })` with the `signOut` from `useAuth()`.

- [ ] **Step 11: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: migrate admin dashboard to PocketBase SDK"
```

---

## Task 7: Migrate Admin Site Detail Page (`src/app/admin/[site]/page.tsx`)

**Files:**
- Modify: `src/app/admin/[site]/page.tsx`

This is the largest file (2542 lines) with ~45 `fetch()` calls. The approach is systematic: replace every `fetch("/api/...")` with the equivalent PocketBase SDK call.

- [ ] **Step 1: Add PocketBase imports at top of file**

Add:
```typescript
import pb from "@/lib/pb";
import { getFileUrl } from "@/lib/pb-queries";
```

Remove any `next-auth` imports if present.

- [ ] **Step 2: Replace all settings fetch calls**

Pattern — replace all occurrences of:
```typescript
const res = await fetch(`/api/sites/${siteId}/settings`);
const data = await res.json();
```
With:
```typescript
const records = await pb.collection("site_settings").getFullList({
  filter: `site="${siteId}"`,
});
const data: Record<string, string> = {};
for (const r of records) data[r.key] = r.value;
```

Pattern — replace all settings PUT calls:
```typescript
await fetch(`/api/sites/${siteId}/settings`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ key, value }),
});
```
With:
```typescript
// Upsert: try to find existing, update or create
try {
  const existing = await pb.collection("site_settings").getFirstListItem(
    `site="${siteId}" && key="${key}"`
  );
  await pb.collection("site_settings").update(existing.id, { value });
} catch {
  await pb.collection("site_settings").create({ site: siteId, key, value });
}
```

To avoid repeating this upsert pattern ~15 times, add a helper function at the top of the file:
```typescript
async function upsertSetting(siteId: string, key: string, value: string) {
  try {
    const existing = await pb.collection("site_settings").getFirstListItem(
      `site="${siteId}" && key="${key}"`
    );
    await pb.collection("site_settings").update(existing.id, { value });
  } catch {
    await pb.collection("site_settings").create({ site: siteId, key, value });
  }
}
```

- [ ] **Step 3: Replace upload calls**

Pattern — replace:
```typescript
const res = await fetch("/api/upload", { method: "POST", body: formData });
const uploaded = await res.json();
```

For image uploads that are attached to a specific record (e.g., speaker photo, venue image), the upload now happens as part of creating/updating the record itself. The `formData` is sent directly to the record's create/update call.

For standalone uploads (banner images stored as settings values), upload to a record and use its file URL:
```typescript
// If uploading a banner to store as a setting value, create a temporary approach:
// Use the site's logo field, OR store in a dedicated collection, OR use the site_settings value to point to a PocketBase file URL
```

This varies per upload context — each upload call site needs individual handling based on what it uploads to.

- [ ] **Step 4: Replace speakers CRUD**

```typescript
// List speakers
const records = await pb.collection("speakers").getFullList({
  filter: `site="${siteId}"`,
  sort: "sortOrder",
});

// Create speaker
const formData = new FormData();
formData.append("site", siteId);
formData.append("name", name);
// ... other fields
if (photoFile) formData.append("photo", photoFile);
await pb.collection("speakers").create(formData);

// Update speaker
await pb.collection("speakers").update(speakerId, formData);

// Delete speaker
await pb.collection("speakers").delete(speakerId);
```

- [ ] **Step 5: Replace programme/days CRUD**

```typescript
// List days with sessions
const days = await pb.collection("days").getFullList({
  filter: `site="${siteId}"`,
  sort: "dayNumber",
});
// Then fetch sessions per day (same pattern as pb-queries.ts)

// Create day
await pb.collection("days").create({
  site: siteId,
  dayNumber: number,
  date: dateStr,
  titleZh: titleZh,
  titleEn: titleEn,
});

// Create session
await pb.collection("sessions").create({
  day: dayId,
  type: type,
  titleZh: titleZh,
  // ... other fields
});

// Update day
await pb.collection("days").update(dayId, { date, titleZh, titleEn });

// Delete day
await pb.collection("days").delete(dayId);

// Update session
await pb.collection("sessions").update(sessionId, { ...fields });

// Delete session
await pb.collection("sessions").delete(sessionId);
```

- [ ] **Step 6: Replace venues CRUD**

```typescript
// List
const venues = await pb.collection("venues").getFullList({
  filter: `site="${siteId}"`,
});

// Create (with image file)
const formData = new FormData();
formData.append("site", siteId);
formData.append("name", name);
if (imageFile) formData.append("image", imageFile);
await pb.collection("venues").create(formData);

// Update
await pb.collection("venues").update(venueId, formData);

// Delete
await pb.collection("venues").delete(venueId);
```

- [ ] **Step 7: Replace registrations CRUD**

```typescript
// List
const registrations = await pb.collection("registrations").getFullList({
  filter: `site="${siteId}"`,
  sort: "-created",
});

// Update status
await pb.collection("registrations").update(regId, { status: newStatus });

// Delete
await pb.collection("registrations").delete(regId);
```

- [ ] **Step 8: Replace site fetch/update calls**

```typescript
// Get site
const site = await pb.collection("sites").getOne(siteId);

// Update site
await pb.collection("sites").update(siteId, { name, slug, status });

// Get all sites (for site switcher)
const sites = await pb.collection("sites").getFullList();
```

- [ ] **Step 9: Replace speaker create in programme panel**

The programme panel has a quick-create speaker flow:
```typescript
// Replace fetch("/api/speakers", { method: "POST", ... })
const newSpeaker = await pb.collection("speakers").create({
  site: siteId,
  name: name,
  nameCn: nameCn,
  affiliation: affiliation,
  status: "confirmed",
});
```

- [ ] **Step 10: Update all ID references from `number` to `string`**

Throughout the file, any place that uses `site.id`, `speaker.id`, etc. as a number needs to accept string. PocketBase IDs are 15-char strings. Check:
- State types (`useState<number>` → `useState<string>`)
- Comparison operators (`=== 0` for ID checks → `=== ""` or null checks)
- URL params (`siteId` from route params is already a string)

- [ ] **Step 11: Update timestamp field names**

Replace all references:
- `createdAt` → `created`
- `updatedAt` → `updated`

- [ ] **Step 12: Update image URL references**

Any place that renders an uploaded image using a path like `/uploads/...` should use:
```typescript
pb.files.getURL(record, record.photo)
// or
pb.files.getURL(record, record.image)
```

Import `pb` if not already imported.

- [ ] **Step 13: Commit**

```bash
git add src/app/admin/\[site\]/page.tsx
git commit -m "feat: migrate admin site detail page to PocketBase SDK"
```

---

## Task 8: Delete API Routes and Infrastructure Files

**Files:**
- Delete: `src/app/api/` (entire directory)
- Delete: `src/app/uploads/` (if exists)
- Delete: `prisma/` (entire directory)
- Delete: `docker-compose.yml`
- Delete: `Dockerfile`
- Delete: `DEPLOY.md`
- Delete: `nginx/` (entire directory)

- [ ] **Step 1: Delete API routes**

```bash
rm -rf src/app/api
```

- [ ] **Step 2: Delete uploads route (if exists)**

```bash
rm -rf src/app/uploads
```

- [ ] **Step 3: Delete Prisma directory**

```bash
rm -rf prisma
```

- [ ] **Step 4: Delete Docker and deployment files**

```bash
rm -f docker-compose.yml Dockerfile DEPLOY.md
rm -rf nginx
```

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "chore: remove API routes, Prisma, Docker, nginx files"
```

---

## Task 9: Update CLAUDE.md and Verify Build

**Files:**
- Modify: `CLAUDE.md`
- Modify: `src/app/layout.tsx` (if it imports anything server-only)

- [ ] **Step 1: Check `src/app/layout.tsx` for server-only imports**

Read the file. If it imports from `@/lib/auth` or `@/lib/prisma`, remove those imports. The root layout should be a simple client-compatible layout with fonts and global CSS.

- [ ] **Step 2: Update `CLAUDE.md`**

Update to reflect the new architecture:
- Remove Prisma, Auth.js, Sharp, Redis, Docker references
- Add PocketBase SDK, PocketHost URL, Cloudflare Pages deployment
- Update commands (remove db:*, docker:* scripts)
- Update environment variables section

- [ ] **Step 3: Run build to verify**

```bash
npm run build
```

Fix any build errors. Common issues:
- Imports from deleted files (`@/lib/prisma`, `@/lib/auth`, etc.)
- `generateMetadata` in layouts (not allowed in static export with dynamic routes)
- `redirect()` usage in server components
- References to `next-auth/react` in any remaining file

- [ ] **Step 4: Test locally**

```bash
npx serve out
```

Open `http://localhost:3000` and verify:
- Public site loads and fetches data from PocketBase
- Admin login works with PocketBase credentials
- Admin dashboard loads sites
- Admin site detail page loads and CRUD operations work

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md src/app/layout.tsx
git commit -m "docs: update CLAUDE.md for PocketBase architecture"
```

---

## Task 10: Deploy to Cloudflare Pages

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Connect to Cloudflare Pages**

In Cloudflare dashboard:
1. Pages → Create a project → Connect to Git
2. Select the repository
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `out`
   - Node version: 20
4. No environment variables needed (PocketBase URL is in code)

- [ ] **Step 3: Verify deployment**

After deploy completes, visit the Cloudflare Pages URL and verify all functionality works.
