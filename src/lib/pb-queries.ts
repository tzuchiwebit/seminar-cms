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
    sort: "date,dayNumber",
  });

  const dayIds = days.map((d) => d.id);
  if (dayIds.length === 0) return [];

  // 1 request: all sessions
  const sessions = await pb.collection("sessions").getFullList({
    filter: dayIds.map((id) => `day="${id}"`).join(" || "),
    sort: "sortOrder",
  });

  let sessionSpeakers: any[] = [];
  let papers: any[] = [];
  const sessionIds = sessions.map((s) => s.id);

  if (sessionIds.length > 0) {
    // 2 requests in parallel: session_speakers + papers
    const ssFilter = sessionIds.map((id) => `session="${id}"`).join(" || ");
    try {
      [sessionSpeakers, papers] = await Promise.all([
        pb.collection("session_speakers").getFullList({ filter: ssFilter, expand: "speaker" }),
        pb.collection("papers").getFullList({ filter: ssFilter, sort: "sortOrder", expand: "speaker" }),
      ]);
    } catch {
      // Fallback: chunk if filter too long
      for (let i = 0; i < sessionIds.length; i += 20) {
        const chunk = sessionIds.slice(i, i + 20);
        const f = chunk.map((id) => `session="${id}"`).join(" || ");
        const [ss, pp] = await Promise.all([
          pb.collection("session_speakers").getFullList({ filter: f, expand: "speaker" }),
          pb.collection("papers").getFullList({ filter: f, sort: "sortOrder", expand: "speaker" }),
        ]);
        sessionSpeakers.push(...ss);
        papers.push(...pp);
      }
    }
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

export async function getSiteSpeakers(siteId: string) {
  // Just fetch speakers — session/paper data comes from getSiteDays
  const speakers = await pb.collection("speakers").getFullList({
    filter: `site="${siteId}" && status="confirmed"`,
    sort: "sortOrder",
  });

  return speakers.map((spk) => ({
    ...spk,
    photo: spk.photo ? pb.files.getURL(spk, spk.photo) : "",
  }));
}

export async function getSiteVenues(siteId: string) {
  const venues = await pb.collection("venues").getFullList({
    filter: `site="${siteId}"`,
  });
  return venues.map((v) => ({
    ...v,
    image: v.image ? pb.files.getURL(v, v.image) : "",
  }));
}

export async function getSiteExhibitions(siteId: string) {
  return pb.collection("exhibitions").getFullList({
    filter: `site="${siteId}"`,
  });
}

export async function getSiteCssVariables(siteId: string): Promise<{ theme_colors: string; theme_typography: string }> {
  try {
    const r = await pb.collection("css_variables").getFirstListItem(`site="${siteId}"`);
    return {
      theme_colors: r.theme_colors || "[]",
      theme_typography: r.theme_typography || "[]",
    };
  } catch {
    return { theme_colors: "[]", theme_typography: "[]" };
  }
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
