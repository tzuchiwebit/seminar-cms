// One-time migration: assign stable ids to speaker.talkTitle entries,
// then link existing papers to those ids by text match.
//
// Usage:
//   node scripts/migrate-talk-title-ids.mjs           # dry-run (default)
//   node scripts/migrate-talk-title-ids.mjs --apply   # actually write to PocketBase
//
// Idempotent: re-running skips entries that already have an id and papers
// that already have a talkTitleId.

const PB = "https://academic-events.pockethost.io";
const APPLY = process.argv.includes("--apply");

const ALPHA = "abcdefghijklmnopqrstuvwxyz0123456789";
function genId() {
  let out = "t_";
  for (let i = 0; i < 11; i++) out += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return out;
}

async function pbGet(path) {
  const res = await fetch(`${PB}${path}`);
  if (!res.ok) throw new Error(`GET ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

async function pbPatch(collection, id, body) {
  const res = await fetch(`${PB}/api/collections/${collection}/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${collection}/${id} ${res.status}: ${await res.text()}`);
  return res.json();
}

async function fetchAll(collection, fields) {
  const out = [];
  let page = 1;
  while (true) {
    const r = await pbGet(`/api/collections/${collection}/records?perPage=200&page=${page}&fields=${fields}`);
    out.push(...r.items);
    if (out.length >= r.totalItems) break;
    page++;
  }
  return out;
}

function normalizeText(s) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

async function main() {
  console.log(APPLY ? "=== APPLY MODE — will write to PocketBase ===" : "=== DRY-RUN — no writes ===\n");

  // Phase 1: speakers
  const speakers = await fetchAll("speakers", "id,name,talkTitle");
  console.log(`Loaded ${speakers.length} speakers`);

  let speakersUpdated = 0;
  let entriesAssigned = 0;
  const speakerEntryMap = new Map(); // speakerId → entries with ids

  for (const s of speakers) {
    let arr;
    try { arr = JSON.parse(s.talkTitle || "[]"); } catch { arr = []; }
    if (!Array.isArray(arr)) arr = [];

    let changed = false;
    const newArr = arr.map((entry) => {
      if (entry && typeof entry === "object" && entry.id) return entry;
      changed = true;
      entriesAssigned++;
      return { id: genId(), en: entry?.en || "", zh: entry?.zh || "" };
    });

    speakerEntryMap.set(s.id, newArr);

    if (changed) {
      speakersUpdated++;
      console.log(`  speaker ${s.name} — assigning ids to ${newArr.length} entries`);
      if (APPLY) await pbPatch("speakers", s.id, { talkTitle: JSON.stringify(newArr) });
    }
  }
  console.log(`Speakers: ${speakersUpdated}/${speakers.length} updated, ${entriesAssigned} entries got ids\n`);

  // Phase 2: papers — link by text match
  const papers = await fetchAll("papers", "id,session,speaker,titleEn,titleZh,talkTitleId");
  console.log(`Loaded ${papers.length} papers`);

  let papersLinked = 0;
  let papersAlreadyLinked = 0;
  let papersNoMatch = 0;
  let papersNoSpeaker = 0;

  for (const p of papers) {
    if (p.talkTitleId) { papersAlreadyLinked++; continue; }
    if (!p.speaker) { papersNoSpeaker++; continue; }

    const entries = speakerEntryMap.get(p.speaker) || [];
    const pEn = normalizeText(p.titleEn);
    const pZh = normalizeText(p.titleZh);

    const match = entries.find((e) => {
      const en = normalizeText(e.en);
      const zh = normalizeText(e.zh);
      return (pEn && en === pEn) || (pZh && zh === pZh);
    });

    if (match) {
      papersLinked++;
      console.log(`  paper "${(p.titleEn || p.titleZh).slice(0, 50)}" → ${match.id}`);
      if (APPLY) await pbPatch("papers", p.id, { talkTitleId: match.id });
    } else {
      papersNoMatch++;
      console.log(`  paper "${(p.titleEn || p.titleZh || "(empty)").slice(0, 50)}" — NO MATCH on speaker ${p.speaker}`);
    }
  }

  console.log(`\nPapers: linked=${papersLinked}, already-linked=${papersAlreadyLinked}, no-match=${papersNoMatch}, no-speaker=${papersNoSpeaker}`);
  if (!APPLY) console.log("\n(re-run with --apply to actually write changes)");
}

main().catch((e) => { console.error(e); process.exit(1); });
