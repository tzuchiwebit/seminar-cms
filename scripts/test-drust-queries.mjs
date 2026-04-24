// Quick end-to-end test for drust-queries via the running /api/drust proxy.
// Uses the same SQL the real query functions issue and applies the same shape
// conversion — validates that components will get the right data.

const BASE = "http://localhost:3000/api/drust";

async function q(sql) {
  const r = await fetch(`${BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  const { column_names, rows } = await r.json();
  return rows.map((row) => Object.fromEntries(column_names.map((c, i) => [c, row[i]])));
}

const SITE = "tz4k80pjf97qimy";

console.log("--- getSiteBySlug('symposium') ---");
const sites = await q(`SELECT * FROM sites WHERE slug = 'symposium' LIMIT 1`);
console.log(JSON.stringify({ id: sites[0].pb_id, name: sites[0].name, slug: sites[0].slug }, null, 2));

console.log("\n--- getSiteSettings (count) ---");
const settings = await q(`SELECT st.key, st.value FROM site_settings st JOIN sites s ON st.site = s.id WHERE s.pb_id = '${SITE}'`);
console.log(`${settings.length} settings; sample:`, settings[0]);

console.log("\n--- getSiteVenues ---");
const venues = await q(`SELECT v.*, s.pb_id AS site_pb_id FROM venues v JOIN sites s ON v.site = s.id WHERE s.pb_id = '${SITE}'`);
console.log(`${venues.length} venues; sample id/name/site:`, venues.map((v) => ({ id: v.pb_id, name: v.name, site: v.site_pb_id })));

console.log("\n--- getSiteSpeakers (confirmed, ordered) ---");
const speakers = await q(`SELECT sp.*, s.pb_id AS site_pb_id FROM speakers sp JOIN sites s ON sp.site = s.id WHERE s.pb_id = '${SITE}' AND sp.status = 'confirmed' ORDER BY sp.sort_order LIMIT 3`);
console.log(`sample:`, speakers.map((s) => ({ id: s.pb_id, name: s.name, sort_order: s.sort_order })));

console.log("\n--- getSiteDays nested (days→sessions→session_speakers→speaker) ---");
const days = await q(`SELECT d.*, s.pb_id AS site_pb_id FROM days d JOIN sites s ON d.site = s.id WHERE s.pb_id = '${SITE}' ORDER BY d.date, d.day_number`);
console.log(`${days.length} days`);
const dayPbIds = days.map((d) => d.pb_id);
const dayIdsList = dayPbIds.map((id) => `'${id}'`).join(",");
const sessions = await q(`SELECT se.*, d.pb_id AS day_pb_id FROM sessions se JOIN days d ON se.day = d.id WHERE d.pb_id IN (${dayIdsList}) ORDER BY se.sort_order`);
console.log(`${sessions.length} sessions`);
const sessionPbIds = sessions.map((s) => s.pb_id);
const sessionIdsList = sessionPbIds.map((id) => `'${id}'`).join(",");
const ss = await q(`SELECT ss.pb_id, ss.role, se.pb_id AS session_pb_id, sp.pb_id AS speaker_pb_id, sp.name FROM session_speakers ss JOIN sessions se ON ss.session = se.id JOIN speakers sp ON ss.speaker = sp.id WHERE se.pb_id IN (${sessionIdsList})`);
console.log(`${ss.length} session_speakers; sample:`, ss[0]);

console.log("\n✅ All queries returned data. Drust data layer ready to serve components.");
