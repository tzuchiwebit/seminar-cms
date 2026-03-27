# Database-Driven CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded data in both the public website and admin dashboard with PostgreSQL-backed data, so content is editable from the admin dashboard.

**Architecture:** The public page becomes a Next.js Server Component that reads from Prisma directly (no API needed for SSR). The admin dashboard panels become client components that fetch/mutate via existing + new API routes. Site-level content (description, highlights) uses the `SiteSetting` key-value model.

**Tech Stack:** Next.js 15 (App Router), Prisma ORM, PostgreSQL, TypeScript

---

## File Structure

### New Files
- `src/lib/queries.ts` — Server-side Prisma queries for the public page
- `src/app/(public)/[slug]/HomePage.tsx` — Client component for interactive UI (tabs, modals, animations)
- `src/app/api/venues/route.ts` — Venues CRUD (GET, POST)
- `src/app/api/venues/[id]/route.ts` — Venue by ID (GET, PUT, DELETE)
- `src/app/api/exhibitions/route.ts` — Exhibitions CRUD (GET, POST)
- `src/app/api/exhibitions/[id]/route.ts` — Exhibition by ID (GET, PUT, DELETE)
- `src/app/api/papers/[id]/route.ts` — Paper by ID (PUT, DELETE)
- `src/app/api/sessions/[id]/route.ts` — Session by ID (PUT, DELETE)
- `src/app/api/registrations/[id]/route.ts` — Registration by ID (PUT, DELETE)

### Modified Files
- `src/app/(public)/[slug]/page.tsx` — Server Component that fetches data, passes to HomePage client component
- `src/app/admin/[site]/page.tsx` — All panels wired to API (fetch on load, mutate on action)
- `src/app/api/programme/route.ts` — Add siteId lookup by slug

---

### Task 1: Create server-side query layer (`src/lib/queries.ts`)

**Files:**
- Create: `src/lib/queries.ts`

- [ ] **Step 1: Create queries.ts with all public page data fetchers**

```typescript
// src/lib/queries.ts
import { prisma } from "@/lib/prisma";

export async function getSiteBySlug(slug: string) {
  return prisma.site.findUnique({
    where: { slug },
    include: {
      settings: true,
      venues: { orderBy: { id: "asc" } },
      exhibitions: true,
    },
  });
}

export async function getSiteDays(siteId: number) {
  return prisma.day.findMany({
    where: { siteId },
    orderBy: { dayNumber: "asc" },
    include: {
      sessions: {
        orderBy: { sortOrder: "asc" },
        include: {
          sessionSpeakers: {
            include: { speaker: true },
          },
          papers: {
            orderBy: { sortOrder: "asc" },
            include: { speaker: true },
          },
        },
      },
    },
  });
}

export async function getSiteSpeakers(siteId: number) {
  return prisma.speaker.findMany({
    where: { siteId },
    orderBy: { sortOrder: "asc" },
    include: {
      sessionSpeakers: {
        include: { session: { include: { day: true } } },
      },
      papers: true,
    },
  });
}

export async function getSiteSettings(siteId: number) {
  const settings = await prisma.siteSetting.findMany({
    where: { siteId },
  });
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return map;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/queries.ts
git commit -m "feat: add server-side query layer for public page"
```

---

### Task 2: Convert public page to Server Component + Client Component split

**Files:**
- Modify: `src/app/(public)/[slug]/page.tsx` — becomes thin server component
- Create: `src/app/(public)/[slug]/HomePage.tsx` — client component with all interactive UI

The current `page.tsx` is a `"use client"` component with ~800 lines of hardcoded data + UI. We split it:
- `page.tsx`: Server Component — fetches data from DB, serializes, passes as props
- `HomePage.tsx`: Client Component — receives data as props, handles tabs/modals/animations

- [ ] **Step 1: Create the HomePage client component**

Move all the UI code (everything from the `useScrollReveal` hook through the JSX) from the current `page.tsx` into `HomePage.tsx`. Replace hardcoded constants with props. The component signature:

```typescript
// src/app/(public)/[slug]/HomePage.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar, MapPin, Users, Image as ImageIcon, Eye, Clock,
  CalendarDays, BookOpen, Lightbulb, Heart, Globe,
} from "lucide-react";
import SpeakerModal from "@/components/public/SpeakerModal";

// ─── Types matching DB shape ───
type DBSpeaker = {
  id: number;
  name: string;
  nameEn: string | null;
  affiliation: string | null;
  title: string | null;
  bio: string | null;
  photo: string | null;
  sessionSpeakers: {
    role: string;
    session: {
      titleZh: string;
      titleEn: string | null;
      day: { dayNumber: number; date: string; titleZh: string };
    };
  }[];
  papers: { titleZh: string; titleEn: string | null }[];
};

type DBDay = {
  id: number;
  dayNumber: number;
  date: string;
  titleZh: string;
  titleEn: string | null;
  sessions: {
    id: number;
    type: string;
    titleZh: string;
    titleEn: string | null;
    subtitleZh: string | null;
    subtitleEn: string | null;
    startTime: string;
    duration: number | null;
    venue: string | null;
    capacity: number | null;
    sessionSpeakers: {
      role: string;
      speaker: { id: number; name: string; nameEn: string | null };
    }[];
    papers: {
      id: number;
      titleZh: string;
      titleEn: string | null;
      speaker: { name: string; nameEn: string | null } | null;
    }[];
  }[];
};

type HomePageProps = {
  days: DBDay[];
  speakers: DBSpeaker[];
  settings: Record<string, string>;
  siteName: string;
};

// Keep the existing useScrollReveal hook, all sub-components (VenueSection,
// DayTabsOriginal, StickyDayTabs, etc.), and all JSX rendering.
//
// Replace hardcoded constants by deriving from props:
//   - dayTabs: derived from props.days
//   - daySessions: derived from props.days[i].sessions
//   - speakers: from props.speakers
//   - descriptionData: from props.settings
//   - infoCards: derived from props.days date range + siteName
//   - stats: computed from props.days counts

export default function HomePage({ days, speakers, settings, siteName }: HomePageProps) {
  // ... all existing UI code, using props instead of hardcoded constants
}
```

The full implementation will move all existing rendering code from the current `page.tsx` into this component, replacing every reference to the hardcoded `dayTabs`, `daySessions`, `speakers`, `descriptionData`, `infoCards`, and `stats` constants with values derived from the props.

Key derivations inside the component:

```typescript
// Derive dayTabs from DB days
const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];
const dayTabs = days.map((d) => {
  const dt = new Date(d.date);
  const m = dt.getMonth() + 1;
  const dd = dt.getDate();
  const wd = weekdayNames[dt.getDay()];
  return {
    label: `${m}/${dd} (${wd})`,
    date: `${m}.${dd}`,
    weekday: `星期${wd}`,
    theme: d.titleZh,
  };
});

// Derive infoCards
const firstDate = new Date(days[0]?.date);
const lastDate = new Date(days[days.length - 1]?.date);
const dateRange = `${firstDate.getFullYear()}年${firstDate.getMonth() + 1}月${firstDate.getDate()}日─${lastDate.getDate()}日`;
const infoCards = [
  { icon: Calendar, title: dateRange, sub: `${days.length}天學術交流與展覽` },
  { icon: MapPin, title: "哈佛大學", sub: "Student Organization Center at Hilles (SOCH)" },
  { icon: Users, title: "主辦單位", sub: "慈濟基金會 · Harvard CAMLab" },
];

// Derive description from settings
const descriptionData = {
  headline: settings.description_headline || "一場探索佛教未來的學術盛會",
  body: settings.description_body || "",
  highlights: settings.description_highlights
    ? JSON.parse(settings.description_highlights)
    : [
        { icon: "BookOpen", label: "多篇學術論文發表" },
        { icon: "Lightbulb", label: "2 場圓桌論壇對話" },
        { icon: "Heart", label: "跨宗派跨領域交流" },
        { icon: "Globe", label: "來自全球的學者參與" },
      ],
};

// Derive stats from DB counts
const totalSessions = days.flatMap((d) => d.sessions);
const paperSessions = totalSessions.filter((s) => s.type === "paper_session").length;
const roundtables = totalSessions.filter((s) => s.type === "roundtable").length;
const stats = [
  { number: String(days.length), label: "天學術交流" },
  { number: String(paperSessions), label: "場論文發表" },
  { number: String(roundtables), label: "場圓桌論壇" },
  { number: "1", label: "沉浸式展覽" },
];

// Map DB session type to badge color
function getBadge(type: string): "gold" | "green" | "muted" {
  if (["keynote", "opening", "roundtable", "closing", "photo"].includes(type)) return "gold";
  if (["paper_session"].includes(type)) return "green";
  return "muted";
}

// Map DB session type to display label
function getTypeLabel(type: string, titleZh: string): string {
  const typeLabels: Record<string, string> = {
    registration: "報到", opening: "開幕典禮", keynote: "專題演講",
    paper_session: "論文發表", roundtable: "圓桌論壇", break: "休息",
    dinner: "晚宴", closing: "閉幕", photo: "大合照", exhibition: "展覽",
  };
  return typeLabels[type] || titleZh;
}

// Convert speakers for the speaker grid/modal
const speakerList = speakers.map((s) => ({
  name: s.nameEn ? `${s.name} ${s.nameEn}` : s.name,
  affiliation: s.affiliation || "",
  title: s.title || "",
  bio: s.bio || undefined,
  topicZh: s.papers?.[0]?.titleEn || s.papers?.[0]?.titleZh || undefined,
  papers: s.papers?.map((p) => p.titleEn || p.titleZh) || [],
  tags: s.sessionSpeakers?.map((ss) => {
    const dayNum = ss.session.day.dayNumber;
    const dt = new Date(ss.session.day.date);
    return `${dt.getMonth() + 1}/${dt.getDate()} · ${ss.role === "moderator" ? "Moderator" : ss.role === "discussant" ? "Commentator" : ss.session.titleZh}`;
  }) || [],
}));
```

- [ ] **Step 2: Rewrite page.tsx as a thin server component**

```typescript
// src/app/(public)/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getSiteBySlug, getSiteDays, getSiteSpeakers, getSiteSettings } from "@/lib/queries";
import HomePage from "./HomePage";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  const [days, speakers, settings] = await Promise.all([
    getSiteDays(site.id),
    getSiteSpeakers(site.id),
    getSiteSettings(site.id),
  ]);

  // Serialize dates for client component
  const serializedDays = JSON.parse(JSON.stringify(days));
  const serializedSpeakers = JSON.parse(JSON.stringify(speakers));

  return (
    <HomePage
      days={serializedDays}
      speakers={serializedSpeakers}
      settings={settings}
      siteName={site.name}
    />
  );
}
```

- [ ] **Step 3: Verify the public page renders correctly with DB data**

Run: `npm run dev` and open `http://localhost:3000/symposium`
Expected: Page renders with data from the database (same content as before, now from PostgreSQL)

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/[slug]/page.tsx src/app/(public)/[slug]/HomePage.tsx
git commit -m "feat: public page reads from database instead of hardcoded data"
```

---

### Task 3: Add missing API routes (venues, exhibitions, papers/[id], sessions/[id], registrations/[id])

**Files:**
- Create: `src/app/api/venues/route.ts`
- Create: `src/app/api/venues/[id]/route.ts`
- Create: `src/app/api/exhibitions/route.ts`
- Create: `src/app/api/exhibitions/[id]/route.ts`
- Create: `src/app/api/papers/[id]/route.ts`
- Create: `src/app/api/sessions/[id]/route.ts`
- Create: `src/app/api/registrations/[id]/route.ts`

- [ ] **Step 1: Create venues API**

```typescript
// src/app/api/venues/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");
  const where: Record<string, unknown> = {};
  if (siteId) where.siteId = parseInt(siteId);

  const venues = await prisma.venue.findMany({ where, orderBy: { id: "asc" } });
  return NextResponse.json(venues);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const venue = await prisma.venue.create({
    data: {
      siteId: body.siteId,
      name: body.name,
      nameZh: body.nameZh,
      description: body.description,
      address: body.address,
      type: body.type || "main",
      capacity: body.capacity,
      image: body.image,
    },
  });
  return NextResponse.json(venue, { status: 201 });
}
```

```typescript
// src/app/api/venues/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const venue = await prisma.venue.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      nameZh: body.nameZh,
      description: body.description,
      address: body.address,
      type: body.type,
      capacity: body.capacity,
      image: body.image,
    },
  });
  return NextResponse.json(venue);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.venue.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}
```

- [ ] **Step 2: Create exhibitions API**

```typescript
// src/app/api/exhibitions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");
  const where: Record<string, unknown> = {};
  if (siteId) where.siteId = parseInt(siteId);

  const exhibitions = await prisma.exhibition.findMany({ where });
  return NextResponse.json(exhibitions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const exhibition = await prisma.exhibition.create({
    data: {
      siteId: body.siteId,
      titleZh: body.titleZh,
      titleEn: body.titleEn,
      description: body.description,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      venue: body.venue,
      image: body.image,
    },
  });
  return NextResponse.json(exhibition, { status: 201 });
}
```

```typescript
// src/app/api/exhibitions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const exhibition = await prisma.exhibition.update({
    where: { id: parseInt(id) },
    data: {
      titleZh: body.titleZh,
      titleEn: body.titleEn,
      description: body.description,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      venue: body.venue,
      image: body.image,
    },
  });
  return NextResponse.json(exhibition);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.exhibition.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}
```

- [ ] **Step 3: Create papers/[id], sessions/[id], registrations/[id] APIs**

```typescript
// src/app/api/papers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const paper = await prisma.paper.update({
    where: { id: parseInt(id) },
    data: {
      titleZh: body.titleZh,
      titleEn: body.titleEn,
      abstract: body.abstract,
      status: body.status,
      sortOrder: body.sortOrder,
      speakerId: body.speakerId,
      sessionId: body.sessionId,
    },
  });
  return NextResponse.json(paper);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.paper.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}
```

```typescript
// src/app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const session = await prisma.session.update({
    where: { id: parseInt(id) },
    data: {
      type: body.type,
      titleZh: body.titleZh,
      titleEn: body.titleEn,
      subtitleZh: body.subtitleZh,
      subtitleEn: body.subtitleEn,
      startTime: body.startTime,
      duration: body.duration,
      venue: body.venue,
      capacity: body.capacity,
      sortOrder: body.sortOrder,
    },
  });
  return NextResponse.json(session);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.session.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}
```

```typescript
// src/app/api/registrations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const registration = await prisma.registration.update({
    where: { id: parseInt(id) },
    data: { status: body.status },
  });
  return NextResponse.json(registration);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.registration.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/venues/ src/app/api/exhibitions/ src/app/api/papers/\[id\]/ src/app/api/sessions/ src/app/api/registrations/\[id\]/
git commit -m "feat: add missing CRUD API routes for venues, exhibitions, papers, sessions, registrations"
```

---

### Task 4: Wire admin dashboard — add siteId resolution and shared fetch helpers

**Files:**
- Modify: `src/app/admin/[site]/page.tsx` (top section: imports, data, helpers)

The admin page uses `useParams()` to get the site slug. We need to resolve that to a siteId on mount, then use it for all API calls. Add a shared context/state for this.

- [ ] **Step 1: Replace hardcoded data constants with state + API fetch**

Remove the hardcoded `speakersData`, `programmeData`, `papersData`, `venuesData`, `registrationsData` constants. Add state and fetch logic at the top of `SiteDashboard`:

```typescript
// At the top of the SiteDashboard component, add:
const [siteId, setSiteId] = useState<number | null>(null);
const [loading, setLoading] = useState(true);

// Resolve slug to siteId on mount
useEffect(() => {
  async function resolve() {
    const res = await fetch("/api/sites");
    if (!res.ok) return;
    const sites = await res.json();
    const site = sites.find((s: { slug: string }) => s.slug === siteSlug);
    if (site) setSiteId(site.id);
    setLoading(false);
  }
  resolve();
}, [siteSlug]);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/[site]/page.tsx
git commit -m "feat: admin dashboard resolves site slug to siteId from database"
```

---

### Task 5: Wire admin SpeakersPanel to database

**Files:**
- Modify: `src/app/admin/[site]/page.tsx` — `SpeakersPanel` component

- [ ] **Step 1: Replace SpeakersPanel with DB-connected version**

The SpeakersPanel needs to:
1. Accept `siteId` as prop
2. Fetch speakers from `GET /api/speakers?siteId=X`
3. Add speaker via `POST /api/speakers`
4. Edit speaker via `PUT /api/speakers/:id`
5. Delete speaker via `DELETE /api/speakers/:id`

Add an inline edit modal and wire the "新增講者", Pencil, and Trash2 buttons to actual API calls. After each mutation, refetch the speaker list.

```typescript
function SpeakersPanel({ siteId }: { siteId: number }) {
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [editingSpeaker, setEditingSpeaker] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchSpeakers = useCallback(async () => {
    const res = await fetch(`/api/speakers?siteId=${siteId}`);
    if (res.ok) setSpeakers(await res.json());
    setLoading(false);
  }, [siteId]);

  useEffect(() => { fetchSpeakers(); }, [fetchSpeakers]);

  const filtered = filter === "All" ? speakers : speakers.filter((s) => s.status === filter.toLowerCase());

  const handleDelete = async (id: number) => {
    if (!confirm("確定刪除？")) return;
    await fetch(`/api/speakers/${id}`, { method: "DELETE" });
    fetchSpeakers();
  };

  const handleSave = async (data: any) => {
    if (editingSpeaker?.id) {
      await fetch(`/api/speakers/${editingSpeaker.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/speakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, siteId }),
      });
    }
    setShowForm(false);
    setEditingSpeaker(null);
    fetchSpeakers();
  };

  // ... render with existing table UI, but using `speakers` state
  // Wire Pencil button → setEditingSpeaker(speaker) + setShowForm(true)
  // Wire Trash2 button → handleDelete(speaker.id)
  // Wire "新增講者" button → setEditingSpeaker(null) + setShowForm(true)
  // Add a simple modal/form for add/edit
}
```

- [ ] **Step 2: Add inline speaker form modal**

A simple modal with fields: name, nameEn, affiliation, title, bio, status (dropdown). Renders when `showForm` is true.

- [ ] **Step 3: Verify speakers CRUD works**

Open admin dashboard → 講者 tab. Should show DB speakers. Test add, edit, delete.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/[site]/page.tsx
git commit -m "feat: admin speakers panel reads/writes to database"
```

---

### Task 6: Wire admin ProgrammePanel to database

**Files:**
- Modify: `src/app/admin/[site]/page.tsx` — `ProgrammePanel` component

- [ ] **Step 1: Replace ProgrammePanel with DB-connected version**

Fetch days/sessions from `GET /api/programme?siteId=X`. Wire add/edit/delete for sessions via the session API routes.

```typescript
function ProgrammePanel({ siteId }: { siteId: number }) {
  const [days, setDays] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProgramme = useCallback(async () => {
    const res = await fetch(`/api/programme?siteId=${siteId}`);
    if (res.ok) setDays(await res.json());
    setLoading(false);
  }, [siteId]);

  useEffect(() => { fetchProgramme(); }, [fetchProgramme]);

  const day = days[activeDay];

  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm("確定刪除此場次？")) return;
    await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    fetchProgramme();
  };

  // ... render with existing UI structure
  // Map day.sessions to session cards with edit/delete wired
}
```

- [ ] **Step 2: Add session edit/create form**

Modal form with fields: type (dropdown), titleZh, titleEn, startTime, duration, venue, sortOrder. For create, POST to `/api/programme` with `type: "session"`. For update, PUT to `/api/sessions/:id`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/[site]/page.tsx
git commit -m "feat: admin programme panel reads/writes to database"
```

---

### Task 7: Wire admin PapersPanel to database

**Files:**
- Modify: `src/app/admin/[site]/page.tsx` — `PapersPanel` component

- [ ] **Step 1: Replace PapersPanel with DB-connected version**

Fetch from `GET /api/papers`. Wire CRUD via papers API.

```typescript
function PapersPanel({ siteId }: { siteId: number }) {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPapers = useCallback(async () => {
    // Papers API doesn't filter by siteId directly, so we fetch all
    // and the admin context ensures we only see papers for this site's sessions
    const res = await fetch("/api/papers");
    if (res.ok) {
      const all = await res.json();
      // Filter to papers belonging to this site's sessions
      setPapers(all.filter((p: any) => p.session?.day?.siteId === siteId));
    }
    setLoading(false);
  }, [siteId]);

  useEffect(() => { fetchPapers(); }, [fetchPapers]);

  const handleDelete = async (id: number) => {
    if (!confirm("確定刪除？")) return;
    await fetch(`/api/papers/${id}`, { method: "DELETE" });
    fetchPapers();
  };

  // ... render with existing table UI
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/[site]/page.tsx
git commit -m "feat: admin papers panel reads/writes to database"
```

---

### Task 8: Wire admin VenuesPanel and ExhibitionPanel to database

**Files:**
- Modify: `src/app/admin/[site]/page.tsx` — `VenuesPanel` and `ExhibitionPanel`

- [ ] **Step 1: Replace VenuesPanel with DB-connected version**

Fetch from `GET /api/venues?siteId=X`. Wire add/edit/delete.

- [ ] **Step 2: Replace ExhibitionPanel with DB-connected version**

Fetch from `GET /api/exhibitions?siteId=X`. Wire save button to `PUT /api/exhibitions/:id`. The exhibition form fields (titleZh, titleEn, description, startDate, endDate, venue) should read from DB and save on button click.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/[site]/page.tsx
git commit -m "feat: admin venues and exhibition panels read/write to database"
```

---

### Task 9: Wire admin RegistrationsPanel to database

**Files:**
- Modify: `src/app/admin/[site]/page.tsx` — `RegistrationsPanel`

- [ ] **Step 1: Replace RegistrationsPanel with DB-connected version**

Fetch from `GET /api/registrations?siteId=X`. Display real data. Wire status update via `PUT /api/registrations/:id`.

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/[site]/page.tsx
git commit -m "feat: admin registrations panel reads from database"
```

---

### Task 10: Wire admin DescriptionPanel and SettingsPanel to database via SiteSetting

**Files:**
- Modify: `src/app/admin/[site]/page.tsx` — `DescriptionPanel` and `SettingsPanel`

- [ ] **Step 1: Wire DescriptionPanel**

Read settings from `GET /api/sites/:id/settings`. Save button writes each field via `PUT /api/sites/:id/settings` with keys: `description_headline`, `description_headline_en`, `description_body`, `description_body_en`, `description_highlights`.

```typescript
function DescriptionPanel({ siteId }: { siteId: number }) {
  const [headline, setHeadline] = useState("");
  const [headlineEn, setHeadlineEn] = useState("");
  const [body, setBody] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/sites/${siteId}/settings`);
      if (!res.ok) return;
      const data = await res.json();
      setHeadline(data.description_headline || "");
      setHeadlineEn(data.description_headline_en || "");
      setBody(data.description_body || "");
      setBodyEn(data.description_body_en || "");
    }
    load();
  }, [siteId]);

  const handleSave = async () => {
    setSaving(true);
    const settings = {
      description_headline: headline,
      description_headline_en: headlineEn,
      description_body: body,
      description_body_en: bodyEn,
    };
    for (const [key, value] of Object.entries(settings)) {
      await fetch(`/api/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
    }
    setSaving(false);
  };

  // ... existing form UI but with controlled inputs
}
```

- [ ] **Step 2: Wire SettingsPanel**

Read site data from `GET /api/sites/:id`. Save via `PUT /api/sites/:id`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/[site]/page.tsx
git commit -m "feat: admin description and settings panels read/write to database"
```

---

### Task 11: Add siteId to papers API filter and seed description settings

**Files:**
- Modify: `src/app/api/papers/route.ts` — add siteId filter support
- Modify: `prisma/seed.ts` — seed description settings

- [ ] **Step 1: Update papers API to support siteId filter**

```typescript
// Add to GET handler in src/app/api/papers/route.ts
const siteId = searchParams.get("siteId");
// ... existing where logic ...
if (siteId) {
  // Filter papers by site via session → day → siteId
  where.session = { day: { siteId: parseInt(siteId) } };
}
```

- [ ] **Step 2: Add description settings to seed.ts**

Add to the end of the seed `main()` function, before the success log:

```typescript
// ── Site Settings (description) ──
const descSettings = [
  { key: "description_headline", value: "一場探索佛教未來的學術盛會" },
  { key: "description_headline_en", value: "An Academic Symposium Exploring the Future of Buddhism" },
  { key: "description_body", value: "「全球共善學思會」匯聚國際佛學研究者、宗教實踐者與人文學者，以學術發表、圓桌論壇與沉浸式藝術體驗，深入探討應用佛教、菩薩道精神與佛教藝術的當代轉譯。本次學思會由慈濟基金會與哈佛大學 CAMLab 共同主辦，期盼在學術對話中，為佛教的未來開展新的視野與可能。" },
  { key: "description_body_en", value: "The Tzu Chi Global Symposium brings together international Buddhist scholars, religious practitioners, and humanities researchers for academic presentations, roundtable discussions, and immersive art experiences. Co-hosted by the Tzu Chi Foundation and Harvard University's CAMLab, this symposium explores applied Buddhism, the Bodhisattva path, and the contemporary translation of Buddhist art." },
  { key: "description_highlights", value: JSON.stringify([
    { icon: "BookOpen", label: "多篇學術論文發表" },
    { icon: "Lightbulb", label: "2 場圓桌論壇對話" },
    { icon: "Heart", label: "跨宗派跨領域交流" },
    { icon: "Globe", label: "來自全球的學者參與" },
  ]) },
];

for (const s of descSettings) {
  await prisma.siteSetting.create({
    data: { siteId: site.id, key: s.key, value: s.value },
  });
}
```

- [ ] **Step 3: Re-run seed**

Run: `npm run db:seed`
Expected: "Seed data created successfully!"

- [ ] **Step 4: Commit**

```bash
git add src/app/api/papers/route.ts prisma/seed.ts
git commit -m "feat: add siteId filter to papers API and seed description settings"
```

---

### Task 12: Final integration verification

- [ ] **Step 1: Verify public page**

Run: `npm run dev`
Open: `http://localhost:3000/symposium`
Expected: All content renders from database — days, sessions, speakers, description

- [ ] **Step 2: Verify admin dashboard**

Open: `http://localhost:3000/admin/symposium`
Expected:
- 講者 tab: shows 18 speakers from DB, can add/edit/delete
- 議程 tab: shows 5 days with sessions from DB
- 論文 tab: shows papers from DB
- 場地 tab: shows venues from DB
- 展覽 tab: shows exhibition from DB, can edit
- 報名 tab: shows registrations from DB
- 活動簡介 tab: loads description from settings, can save
- 設定 tab: loads site data, can save

- [ ] **Step 3: Test round-trip: edit in admin, verify on public page**

1. In admin → 講者, edit a speaker name
2. Refresh public page → verify name changed
3. In admin → 活動簡介, change headline
4. Refresh public page → verify headline changed

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete database-driven CMS - admin dashboard edits reflect on public site"
```
