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

  // Fetch sessions for all days in parallel
  const sessionBatches = await Promise.all(
    dayIds.map((dayId) =>
      pb.collection("sessions").getFullList({ filter: `day="${dayId}"`, sort: "sortOrder" })
    )
  );
  const sessions = sessionBatches.flat();
  const sessionIds = sessions.map((s) => s.id);

  let sessionSpeakers: any[] = [];
  let papers: any[] = [];

  if (sessionIds.length > 0) {
    // Batch in chunks of 20, run all chunks in parallel
    const chunkSize = 20;
    const chunks: string[][] = [];
    for (let i = 0; i < sessionIds.length; i += chunkSize) {
      chunks.push(sessionIds.slice(i, i + chunkSize));
    }
    const [ssBatches, pBatches] = await Promise.all([
      Promise.all(chunks.map((chunk) =>
        pb.collection("session_speakers").getFullList({
          filter: chunk.map((id) => `session="${id}"`).join(" || "),
          expand: "speaker",
        })
      )),
      Promise.all(chunks.map((chunk) =>
        pb.collection("papers").getFullList({
          filter: chunk.map((id) => `session="${id}"`).join(" || "),
          sort: "sortOrder",
          expand: "speaker",
        })
      )),
    ]);
    sessionSpeakers = ssBatches.flat();
    papers = pBatches.flat();
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

  // Batch in chunks of 20, run in parallel
  const chunkSize = 20;
  const chunks: string[][] = [];
  for (let i = 0; i < speakerIds.length; i += chunkSize) {
    chunks.push(speakerIds.slice(i, i + chunkSize));
  }
  const [ssBatches, pBatches] = await Promise.all([
    Promise.all(chunks.map((chunk) =>
      pb.collection("session_speakers").getFullList({
        filter: chunk.map((id) => `speaker="${id}"`).join(" || "),
        expand: "session,session.day",
      })
    )),
    Promise.all(chunks.map((chunk) =>
      pb.collection("papers").getFullList({
        filter: chunk.map((id) => `speaker="${id}"`).join(" || "),
      })
    )),
  ]);
  const sessionSpeakers = ssBatches.flat();
  const papers = pBatches.flat();

  return speakers.map((spk) => ({
    ...spk,
    photo: spk.photo ? pb.files.getURL(spk, spk.photo) : "",
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
