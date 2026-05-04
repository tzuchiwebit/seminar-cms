import PocketBase from "pocketbase";

// Separate PocketBase instance for server-side/build-time fetching
// This avoids conflicts with the client-side singleton
const pbServer = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://academic-events.pockethost.io/"
);
pbServer.autoCancellation(false);

export async function fetchSiteDataForBuild(slug: string) {
  const site = await pbServer.collection("sites").getFirstListItem(`slug="${slug}"`);

  const settingsRecords = await pbServer.collection("site_settings").getFullList({
    filter: `site="${site.id}"`,
  });
  const settings: Record<string, string> = {};
  for (const r of settingsRecords) settings[r.key] = r.value;

  // Days + sessions
  const days = await pbServer.collection("days").getFullList({
    filter: `site="${site.id}"`,
    sort: "date,dayNumber",
  });

  const dayIds = days.map((d) => d.id);
  let sessions: any[] = [];
  let sessionSpeakers: any[] = [];
  let papers: any[] = [];

  if (dayIds.length > 0) {
    sessions = await pbServer.collection("sessions").getFullList({
      filter: dayIds.map((id) => `day="${id}"`).join(" || "),
      sort: "sortOrder",
    });

    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length > 0) {
      const ssFilter = sessionIds.map((id) => `session="${id}"`).join(" || ");
      try {
        [sessionSpeakers, papers] = await Promise.all([
          pbServer.collection("session_speakers").getFullList({ filter: ssFilter, expand: "speaker" }),
          pbServer.collection("papers").getFullList({ filter: ssFilter, sort: "sortOrder", expand: "speaker" }),
        ]);
      } catch {
        for (let i = 0; i < sessionIds.length; i += 20) {
          const chunk = sessionIds.slice(i, i + 20);
          const f = chunk.map((id) => `session="${id}"`).join(" || ");
          const [ss, pp] = await Promise.all([
            pbServer.collection("session_speakers").getFullList({ filter: f, expand: "speaker" }),
            pbServer.collection("papers").getFullList({ filter: f, sort: "sortOrder", expand: "speaker" }),
          ]);
          sessionSpeakers.push(...ss);
          papers.push(...pp);
        }
      }
    }
  }

  const daysWithSessions = days.map((day) => ({
    ...day,
    sessions: sessions
      .filter((s) => s.day === day.id)
      .map((s) => ({
        ...s,
        sessionSpeakers: sessionSpeakers
          .filter((ss) => ss.session === s.id)
          .map((ss) => ({ ...ss, speaker: ss.expand?.speaker || null })),
        papers: papers
          .filter((p) => p.session === s.id)
          .map((p) => ({ ...p, speaker: p.expand?.speaker || null })),
      })),
  }));

  // Speakers
  const speakersRaw = await pbServer.collection("speakers").getFullList({
    filter: `site="${site.id}" && status="confirmed"`,
    sort: "sortOrder",
  });
  const speakers = speakersRaw.map((spk) => ({
    ...spk,
    photo: spk.photo ? pbServer.files.getURL(spk, spk.photo) : "",
  }));

  // Venues
  const venuesRaw = await pbServer.collection("venues").getFullList({
    filter: `site="${site.id}"`,
  });
  const venues = venuesRaw.map((v) => ({
    ...v,
    image: v.image ? pbServer.files.getURL(v, v.image) : "",
  }));

  // Exhibitions
  const exhibitions = await pbServer.collection("exhibitions").getFullList({
    filter: `site="${site.id}"`,
  });

  // CSS Variables
  let cssVariables = { theme_colors: "[]", theme_typography: "[]" };
  try {
    const cssRecord = await pbServer.collection("css_variables").getFirstListItem(`site="${site.id}"`);
    cssVariables = { theme_colors: cssRecord.theme_colors || "[]", theme_typography: cssRecord.theme_typography || "[]" };
  } catch { /* no css_variables record */ }

  // Other-section files — fetch ALL uploads for the site, filter client-side.
  // This avoids PB filter/sort syntax errors on newly-added fields (sortOrder, category enum).
  let otherFiles: any[] = [];
  try {
    const allUploads = await pbServer.collection("uploads").getFullList({
      filter: `site="${site.id}"`,
    });
    const otherRecords = allUploads.filter((r) => r.category === "other");
    otherRecords.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    otherFiles = otherRecords.map((r) => ({
      id: r.id,
      label: r.label || "",
      url: pbServer.files.getURL(r, r.file),
      filename: r.file,
    }));
    console.log(`[pb-server] ${slug}: found ${otherFiles.length} 其他 file(s) of ${allUploads.length} uploads`);
  } catch (e) {
    console.error(`[pb-server] ${slug}: failed to fetch uploads:`, e);
  }

  return {
    site: JSON.parse(JSON.stringify(site)),
    days: JSON.parse(JSON.stringify(daysWithSessions)),
    speakers: JSON.parse(JSON.stringify(speakers)),
    settings,
    venues: JSON.parse(JSON.stringify(venues)),
    exhibitions: JSON.parse(JSON.stringify(exhibitions)),
    cssVariables,
    otherFiles,
  };
}
