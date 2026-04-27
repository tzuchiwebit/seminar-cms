// Drust-backed versions of pb-queries.ts. Returns the SAME shape as the PB
// functions so existing components don't need to change: `id` is the PB string
// (stored as `pb_id` in Drust), foreign key fields are likewise PB strings
// (resolved via JOIN), and camelCase field names are preserved.

import { drustQueryObjects, sqlStr } from "./drust";

// ---------- Shape-converters ----------
// Drust stores snake_case field names and integer FKs. PB shape uses
// camelCase and string PB ids. These functions translate one row at a time.
// They also map `pb_id` → `id` and the parent's `pb_id` → the original FK name.

function toPbSite(r: Record<string, unknown>) {
  return {
    id: r.pb_id as string,
    name: (r.name as string) ?? "",
    slug: (r.slug as string) ?? "",
    domain: (r.domain as string) ?? "",
    logo: (r.logo as string) ?? "",
    status: (r.status as string) ?? "",
  };
}

function toPbVenue(r: Record<string, unknown>) {
  return {
    id: r.pb_id as string,
    site: (r.site_pb_id as string) ?? "",
    name: (r.name as string) ?? "",
    nameZh: (r.name_zh as string) ?? "",
    description: (r.description as string) ?? "",
    descriptionEn: (r.description_en as string) ?? "",
    address: (r.address as string) ?? "",
    mapUrl: (r.map_url as string) ?? "",
    capacity: (r.capacity as number) ?? 0,
    image: (r.image as string) ?? "",
    type: (r.type as string) ?? "",
  };
}

function toPbSpeaker(r: Record<string, unknown>) {
  return {
    id: r.pb_id as string,
    site: (r.site_pb_id as string) ?? "",
    name: (r.name as string) ?? "",
    nameCn: (r.name_cn as string) ?? "",
    title_field: (r.title_field as string) ?? "",
    titleZh: (r.title_zh as string) ?? "",
    affiliation: (r.affiliation as string) ?? "",
    affiliationZh: (r.affiliation_zh as string) ?? "",
    bio: (r.bio as string) ?? "",
    talkTitle: (r.talk_title as string) ?? "",
    talkTitleZh: (r.talk_title_zh as string) ?? "",
    photo: (r.photo as string) ?? "",
    photoCrop: r.photo_crop ?? null,
    sortOrder: (r.sort_order as number) ?? 0,
    status: (r.status as string) ?? "",
    last_updated: (r.last_updated as string) ?? "",
  };
}

function toPbDay(r: Record<string, unknown>) {
  return {
    id: r.pb_id as string,
    site: (r.site_pb_id as string) ?? "",
    date: (r.date as string) ?? "",
    dayNumber: (r.day_number as number) ?? 0,
    titleEn: (r.title_en as string) ?? "",
    titleZh: (r.title_zh as string) ?? "",
  };
}

function toPbSession(r: Record<string, unknown>) {
  return {
    id: r.pb_id as string,
    day: (r.day_pb_id as string) ?? "",
    titleEn: (r.title_en as string) ?? "",
    titleZh: (r.title_zh as string) ?? "",
    subtitleEn: (r.subtitle_en as string) ?? "",
    subtitleZh: (r.subtitle_zh as string) ?? "",
    type: (r.type as string) ?? "",
    startTime: (r.start_time as string) ?? "",
    duration: (r.duration as number) ?? 0,
    capacity: (r.capacity as number) ?? 0,
    sortOrder: (r.sort_order as number) ?? 0,
    groupPhoto: !!r.group_photo,
    venue: (r.venue as string) ?? "",
  };
}

function toPbPaper(r: Record<string, unknown>) {
  return {
    id: r.pb_id as string,
    session: (r.session_pb_id as string) ?? "",
    speaker: (r.speaker_pb_id as string) ?? "",
    titleEn: (r.title_en as string) ?? "",
    titleZh: (r.title_zh as string) ?? "",
    abstract: (r.abstract as string) ?? "",
    sortOrder: (r.sort_order as number) ?? 0,
    status: (r.status as string) ?? "",
  };
}

function toPbExhibition(r: Record<string, unknown>) {
  return {
    id: r.pb_id as string,
    site: (r.site_pb_id as string) ?? "",
    titleEn: (r.title_en as string) ?? "",
    titleZh: (r.title_zh as string) ?? "",
    description: (r.description as string) ?? "",
    venue: (r.venue as string) ?? "",
    image: (r.image as string) ?? "",
    startDate: (r.start_date as string) ?? "",
    endDate: (r.end_date as string) ?? "",
  };
}

// ---------- Query functions (mirror of pb-queries.ts) ----------

export async function getSiteBySlug(slug: string) {
  const rows = await drustQueryObjects(
    `SELECT * FROM sites WHERE slug = ${sqlStr(slug)} LIMIT 1`
  );
  if (!rows[0]) throw new Error(`Site not found: ${slug}`);
  return toPbSite(rows[0]);
}

/**
 * Returns the slug of the first published site, sorted by id (creation order).
 * Used to resolve the root URL `/` when no slug is in the path. Returns null
 * if no published site exists.
 */
export async function getDefaultPublishedSlug(): Promise<string | null> {
  const rows = await drustQueryObjects<{ slug: string }>(
    `SELECT slug FROM sites WHERE status = 'published' ORDER BY id ASC LIMIT 1`
  );
  return rows[0]?.slug ?? null;
}

export async function getSiteSettings(siteId: string) {
  const rows = await drustQueryObjects<{ key: string; value: string }>(
    `SELECT st.key, st.value FROM site_settings st
     JOIN sites s ON st.site = s.id
     WHERE s.pb_id = ${sqlStr(siteId)}`
  );
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value ?? "";
  return map;
}

export async function getSiteVenues(siteId: string) {
  const rows = await drustQueryObjects(
    `SELECT v.*, s.pb_id AS site_pb_id FROM venues v
     JOIN sites s ON v.site = s.id
     WHERE s.pb_id = ${sqlStr(siteId)}`
  );
  return rows.map(toPbVenue);
}

export async function getSiteSpeakers(siteId: string) {
  const rows = await drustQueryObjects(
    `SELECT sp.*, s.pb_id AS site_pb_id FROM speakers sp
     JOIN sites s ON sp.site = s.id
     WHERE s.pb_id = ${sqlStr(siteId)} AND sp.status = 'confirmed'
     ORDER BY sp.sort_order`
  );
  return rows.map(toPbSpeaker);
}

export async function getSiteExhibitions(siteId: string) {
  const rows = await drustQueryObjects(
    `SELECT e.*, s.pb_id AS site_pb_id FROM exhibitions e
     JOIN sites s ON e.site = s.id
     WHERE s.pb_id = ${sqlStr(siteId)}`
  );
  return rows.map(toPbExhibition);
}

export async function getSiteCssVariables(siteId: string): Promise<{ theme_colors: string; theme_typography: string }> {
  const rows = await drustQueryObjects<{ theme_colors: string; theme_typography: string }>(
    `SELECT c.theme_colors, c.theme_typography FROM css_variables c
     JOIN sites s ON c.site = s.id
     WHERE s.pb_id = ${sqlStr(siteId)}
     ORDER BY c.pb_created DESC
     LIMIT 1`
  );
  const r = rows[0];
  return {
    theme_colors: r?.theme_colors || "[]",
    theme_typography: r?.theme_typography || "[]",
  };
}

export async function getSiteRegistrations(siteId: string) {
  const rows = await drustQueryObjects(
    `SELECT r.*, s.pb_id AS site_pb_id FROM registrations r
     JOIN sites s ON r.site = s.id
     WHERE s.pb_id = ${sqlStr(siteId)}
     ORDER BY r.created_at DESC`
  );
  return rows.map((r) => ({
    id: r.pb_id as string,
    site: (r.site_pb_id as string) ?? "",
    name: (r.name as string) ?? "",
    email: (r.email as string) ?? "",
    organization: (r.organization as string) ?? "",
    status: (r.status as string) ?? "pending",
    created: (r.created_at as string) ?? "",
  }));
}

export async function getSiteDays(siteId: string) {
  // 1. days
  const dayRows = await drustQueryObjects(
    `SELECT d.*, s.pb_id AS site_pb_id FROM days d
     JOIN sites s ON d.site = s.id
     WHERE s.pb_id = ${sqlStr(siteId)}
     ORDER BY d.date, d.day_number`
  );
  const days = dayRows.map(toPbDay);
  if (days.length === 0) return [];

  const pbDayIds = days.map((d) => d.id);

  // 2. sessions for those days
  const sessionRows = await drustQueryObjects(
    `SELECT se.*, d.pb_id AS day_pb_id FROM sessions se
     JOIN days d ON se.day = d.id
     WHERE d.pb_id IN (${pbDayIds.map(sqlStr).join(",")})
     ORDER BY se.sort_order`
  );
  const sessions = sessionRows.map(toPbSession);
  const pbSessionIds = sessions.map((s) => s.id);

  let sessionSpeakers: Array<ReturnType<typeof toPbSpeaker> extends never ? never : {
    id: string; session: string; speaker: string; role: string;
    expand?: { speaker: ReturnType<typeof toPbSpeaker> | null };
  }> = [];
  let papers: Array<ReturnType<typeof toPbPaper> & { expand?: { speaker: ReturnType<typeof toPbSpeaker> | null } }> = [];

  if (pbSessionIds.length > 0) {
    // 3. session_speakers JOIN speakers
    const ssRows = await drustQueryObjects(
      `SELECT ss.id AS ss_id, ss.pb_id, ss.role,
              se.pb_id AS session_pb_id,
              sp.id AS sp_drust_id, sp.pb_id AS speaker_pb_id,
              sp.name, sp.name_cn, sp.title_field, sp.title_zh,
              sp.affiliation, sp.affiliation_zh, sp.bio,
              sp.talk_title, sp.talk_title_zh, sp.photo, sp.photo_crop,
              sp.sort_order, sp.status, sp.last_updated, sp.site AS speaker_site_drust_id,
              (SELECT pb_id FROM sites WHERE id = sp.site) AS speaker_site_pb_id
       FROM session_speakers ss
       JOIN sessions se ON ss.session = se.id
       JOIN speakers sp ON ss.speaker = sp.id
       WHERE se.pb_id IN (${pbSessionIds.map(sqlStr).join(",")})`
    );
    sessionSpeakers = ssRows.map((r) => ({
      id: r.pb_id as string,
      session: (r.session_pb_id as string) ?? "",
      speaker: (r.speaker_pb_id as string) ?? "",
      role: (r.role as string) ?? "",
      expand: {
        speaker: toPbSpeaker({
          ...r,
          pb_id: r.speaker_pb_id,
          site_pb_id: r.speaker_site_pb_id,
        }),
      },
    }));

    // 4. papers JOIN speakers
    const pRows = await drustQueryObjects(
      `SELECT p.*, se.pb_id AS session_pb_id, sp.pb_id AS speaker_pb_id,
              sp.name AS sp_name, sp.name_cn AS sp_name_cn,
              sp.title_field AS sp_title_field, sp.title_zh AS sp_title_zh,
              sp.affiliation AS sp_affiliation, sp.affiliation_zh AS sp_affiliation_zh,
              sp.bio AS sp_bio, sp.talk_title AS sp_talk_title, sp.talk_title_zh AS sp_talk_title_zh,
              sp.photo AS sp_photo, sp.photo_crop AS sp_photo_crop,
              sp.sort_order AS sp_sort_order, sp.status AS sp_status,
              sp.last_updated AS sp_last_updated,
              (SELECT pb_id FROM sites WHERE id = sp.site) AS speaker_site_pb_id
       FROM papers p
       JOIN sessions se ON p.session = se.id
       LEFT JOIN speakers sp ON p.speaker = sp.id
       WHERE se.pb_id IN (${pbSessionIds.map(sqlStr).join(",")})
       ORDER BY p.sort_order`
    );
    papers = pRows.map((r) => ({
      ...toPbPaper(r),
      expand: {
        speaker: r.speaker_pb_id
          ? toPbSpeaker({
              pb_id: r.speaker_pb_id,
              site_pb_id: r.speaker_site_pb_id,
              name: r.sp_name, name_cn: r.sp_name_cn,
              title_field: r.sp_title_field, title_zh: r.sp_title_zh,
              affiliation: r.sp_affiliation, affiliation_zh: r.sp_affiliation_zh,
              bio: r.sp_bio, talk_title: r.sp_talk_title, talk_title_zh: r.sp_talk_title_zh,
              photo: r.sp_photo, photo_crop: r.sp_photo_crop,
              sort_order: r.sp_sort_order, status: r.sp_status, last_updated: r.sp_last_updated,
            })
          : null,
      },
    }));
  }

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

export function getFileUrl(record: { image?: string; photo?: string; logo?: string }, field: string) {
  return (record as Record<string, string>)[field] || "";
}

// Mirrors pb-server.ts#fetchSiteDataForBuild — one-shot fetch for SSR/build-time.
export async function fetchSiteDataForBuild(slug: string) {
  const site = await getSiteBySlug(slug);
  const [settings, days, speakers, venues, exhibitions, cssVariables] = await Promise.all([
    getSiteSettings(site.id),
    getSiteDays(site.id),
    getSiteSpeakers(site.id),
    getSiteVenues(site.id),
    getSiteExhibitions(site.id),
    getSiteCssVariables(site.id),
  ]);
  return { site, days, speakers, settings, venues, exhibitions, cssVariables };
}
