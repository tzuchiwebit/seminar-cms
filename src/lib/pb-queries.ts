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
