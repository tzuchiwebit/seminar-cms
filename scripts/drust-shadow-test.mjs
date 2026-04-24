// Shadow test: exercise CRUD via the Drust REST + /query endpoints exactly as
// the admin UI (through pb-compat adapter) would. Verifies that every panel's
// underlying data path works on Drust. Cleanup via the full re-mirror script.

const DRUST_BASE = "https://tool.tzuchi-org.tw/drust/t/35d6eba3-a0b7-4f09-9a54-7855fdb417f1";
const TOKEN = process.env.DRUST_TOKEN || "drust_dlNsbg0x90St8s85Z6BHzfTqH3g2xh2zCwgL5oqGWPQ";
const SITE_PB_ID = "tz4k80pjf97qimy";
const SITE_DRUST_ID = 1;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rest(method, path, body) {
  for (let i = 0; i < 6; i++) {
    const opts = { method, headers: { Authorization: `Bearer ${TOKEN}` } };
    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${DRUST_BASE}${path}`, opts);
    if (res.status === 429) {
      const m = (await res.text()).match(/retry after (\d+)s/i);
      await sleep((m ? parseInt(m[1]) : 2) * 1000 + 200);
      continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text.slice(0, 200)}`);
    if (res.status === 204) return null;
    try { return JSON.parse(text); } catch { return text; }
  }
}
const q = (sql) => rest("POST", "/query", { sql });
const insert = (col, data) => rest("POST", `/records/${col}`, { data });
const update = (col, id, data) => rest("PATCH", `/records/${col}/${id}`, { data });
const del = (col, id) => rest("DELETE", `/records/${col}/${id}`);
const genPbId = () => Array.from({ length: 15 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");

const results = [];
const ok = (name) => { results.push({ name, status: "✓" }); console.log(`✓ ${name}`); };
const fail = (name, e) => { results.push({ name, status: "✗", error: e.message }); console.log(`✗ ${name}: ${e.message}`); };

async function test(name, fn) {
  try { await fn(); ok(name); }
  catch (e) { fail(name, e); }
  await sleep(200);
}

// ===== SITES PANEL: site name + status update =====
await test("[Sites] update site name (mimic save site form)", async () => {
  const orig = (await q(`SELECT name FROM sites WHERE id=${SITE_DRUST_ID}`)).rows[0][0];
  await update("sites", SITE_DRUST_ID, { name: "TEST_SITE_NAME" });
  const after = (await q(`SELECT name FROM sites WHERE id=${SITE_DRUST_ID}`)).rows[0][0];
  if (after !== "TEST_SITE_NAME") throw new Error(`name not updated: ${after}`);
  await update("sites", SITE_DRUST_ID, { name: orig });
});

// ===== EVENT INTRO PANEL (活動簡介): site_settings upsert =====
await test("[活動簡介] upsert site_settings (description_headline)", async () => {
  const sel = `SELECT id FROM site_settings WHERE site=${SITE_DRUST_ID} AND key='description_headline'`;
  const existing = (await q(sel)).rows[0]?.[0];
  if (!existing) throw new Error("seed key missing");
  const orig = (await q(`SELECT value FROM site_settings WHERE id=${existing}`)).rows[0][0];
  await update("site_settings", existing, { value: "TEST_HEADLINE" });
  const after = (await q(`SELECT value FROM site_settings WHERE id=${existing}`)).rows[0][0];
  if (after !== "TEST_HEADLINE") throw new Error(`update fail: ${after}`);
  await update("site_settings", existing, { value: orig });
});

// ===== TOUR / NAV (導覽梯次): visibility flag = create new site_settings if missing =====
await test("[導覽梯次] create new site_settings (section_test_visible)", async () => {
  const pid = genPbId();
  const r = await insert("site_settings", { pb_id: pid, site: SITE_DRUST_ID, key: "section_test_visible", value: "false" });
  if (!r.record?.id) throw new Error("no id");
  await del("site_settings", r.record.id);
});

// ===== PROGRAMME (議程) — DAYS CRUD =====
await test("[議程] create/update/delete day", async () => {
  const pid = genPbId();
  const c = await insert("days", { pb_id: pid, site: SITE_DRUST_ID, day_number: 99, date: "2099-01-01 00:00:00.000Z", title_en: "Test Day", title_zh: "測試天" });
  const did = c.record.id;
  await update("days", did, { title_en: "Test Day Updated" });
  const after = (await q(`SELECT title_en FROM days WHERE id=${did}`)).rows[0][0];
  if (after !== "Test Day Updated") throw new Error("day update failed");
  await del("days", did);
});

// ===== PROGRAMME — SESSIONS CRUD (with day FK) =====
await test("[議程] create session with day FK + nested session_speakers", async () => {
  // create temp day first
  const dayPid = genPbId();
  const day = await insert("days", { pb_id: dayPid, site: SITE_DRUST_ID, day_number: 98, date: "2099-02-01 00:00:00.000Z", title_en: "TmpDay" });
  const dayId = day.record.id;
  try {
    const sesPid = genPbId();
    const ses = await insert("sessions", { pb_id: sesPid, day: dayId, title_en: "Test Session", start_time: "09:00", duration: 30, type: "keynote" });
    const sesId = ses.record.id;
    // attach a speaker
    const spkId = (await q(`SELECT id FROM speakers LIMIT 1`)).rows[0][0];
    const ssPid = genPbId();
    const ss = await insert("session_speakers", { pb_id: ssPid, session: sesId, speaker: spkId, role: "speaker" });
    const ssId = ss.record.id;
    // verify join
    const joined = await q(`SELECT se.title_en, sp.name FROM session_speakers ss JOIN sessions se ON ss.session=se.id JOIN speakers sp ON ss.speaker=sp.id WHERE ss.id=${ssId}`);
    if (joined.rows.length !== 1) throw new Error("join failed");
    // cleanup nested
    await del("session_speakers", ssId);
    await del("sessions", sesId);
  } finally {
    await del("days", dayId);
  }
});

// ===== PROGRAMME — papers CRUD =====
await test("[議程] create paper with session+speaker FKs", async () => {
  const sesId = (await q(`SELECT id FROM sessions LIMIT 1`)).rows[0][0];
  const spkId = (await q(`SELECT id FROM speakers LIMIT 1`)).rows[0][0];
  const pid = genPbId();
  const r = await insert("papers", { pb_id: pid, session: sesId, speaker: spkId, title_en: "Test Paper", title_zh: "測試論文", sort_order: 99 });
  await del("papers", r.record.id);
});

// ===== VENUES CRUD =====
await test("[場地] create/update/delete venue", async () => {
  const pid = genPbId();
  const c = await insert("venues", { pb_id: pid, site: SITE_DRUST_ID, name: "Test Venue", name_zh: "測試場地", type: "main", capacity: 100 });
  const vid = c.record.id;
  await update("venues", vid, { name: "Test Venue Updated" });
  const after = (await q(`SELECT name FROM venues WHERE id=${vid}`)).rows[0][0];
  if (after !== "Test Venue Updated") throw new Error("venue update failed");
  await del("venues", vid);
});

// ===== SPEAKERS CRUD (already verified in earlier UI test, sanity-check again) =====
await test("[講者] create/update/delete speaker", async () => {
  const pid = genPbId();
  const c = await insert("speakers", { pb_id: pid, site: SITE_DRUST_ID, name: "Test Speaker", status: "pending" });
  const sid = c.record.id;
  await update("speakers", sid, { name: "Test Speaker Updated" });
  await del("speakers", sid);
});

// ===== EXHIBITIONS CRUD =====
await test("[展覽] create/update/delete exhibition", async () => {
  const pid = genPbId();
  const c = await insert("exhibitions", { pb_id: pid, site: SITE_DRUST_ID, title_en: "Test Exh", title_zh: "測試展覽", venue: "TestVenue" });
  const xid = c.record.id;
  await update("exhibitions", xid, { title_en: "Test Exh Updated" });
  await del("exhibitions", xid);
});

// ===== REGISTRATIONS CRUD (admin can change status / delete) =====
await test("[報名] create/update status/delete registration", async () => {
  const pid = genPbId();
  const c = await insert("registrations", { pb_id: pid, site: SITE_DRUST_ID, name: "Test User", email: "test@example.com", status: "pending" });
  const rid = c.record.id;
  await update("registrations", rid, { status: "confirmed" });
  await del("registrations", rid);
});

// ===== STYLES (樣式設定) — css_variables update =====
await test("[樣式設定] update css_variables theme_colors", async () => {
  const cssRow = (await q(`SELECT id, theme_colors FROM css_variables WHERE site=${SITE_DRUST_ID} ORDER BY pb_created DESC LIMIT 1`)).rows[0];
  const cssId = cssRow[0];
  const orig = cssRow[1];
  const testColors = JSON.stringify([{ label: "test", hex: "#000000" }]);
  await update("css_variables", cssId, { theme_colors: testColors });
  const after = (await q(`SELECT theme_colors FROM css_variables WHERE id=${cssId}`)).rows[0][0];
  if (after !== testColors) throw new Error("css update failed");
  await update("css_variables", cssId, { theme_colors: orig });
});

// ===== SETTINGS panel (last_updated / deploy_hook_url etc.) — same as upsertSetting =====
await test("[設定] upsert deploy_hook_url setting", async () => {
  const key = "test_only_setting";
  const pid = genPbId();
  const c = await insert("site_settings", { pb_id: pid, site: SITE_DRUST_ID, key, value: "https://test.example/hook" });
  const sid = c.record.id;
  await update("site_settings", sid, { value: "https://test2.example/hook" });
  await del("site_settings", sid);
});

// ===== Cross-site relation: ensure trial site (site=2) is queryable separately =====
await test("[Site isolation] /trial site is independent of /symposium", async () => {
  const trialSettings = await q(`SELECT COUNT(*) FROM site_settings WHERE site=2`);
  const symSettings = await q(`SELECT COUNT(*) FROM site_settings WHERE site=1`);
  const tn = trialSettings.rows[0][0];
  const sn = symSettings.rows[0][0];
  if (tn === 0 && sn === 0) throw new Error("both empty?");
  console.log(`   (symposium=${sn}, trial=${tn})`);
});

console.log(`\n=== SUMMARY ===`);
const pass = results.filter((r) => r.status === "✓").length;
const fl = results.filter((r) => r.status === "✗").length;
console.log(`PASS: ${pass} / ${results.length}`);
if (fl > 0) {
  console.log(`FAIL:`);
  results.filter((r) => r.status === "✗").forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
}
process.exit(fl > 0 ? 1 : 0);
