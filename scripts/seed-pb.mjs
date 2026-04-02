import PocketBase from "pocketbase";

const pb = new PocketBase("https://academic-events.pockethost.io/");

const SITE_ID = "tz4k80pjf97qimy";

async function deleteAll(collectionName) {
  let page = 1;
  let deleted = 0;
  while (true) {
    const result = await pb.collection(collectionName).getList(1, 200, { filter: `site = "${SITE_ID}" || site = ""` }).catch(() => null);
    // fallback: try without filter for collections that may not have site field
    const records = result ? result.items : (await pb.collection(collectionName).getList(1, 200)).items;
    if (records.length === 0) break;
    for (const r of records) {
      await pb.collection(collectionName).delete(r.id);
      deleted++;
    }
  }
  return deleted;
}

async function deleteAllNoFilter(collectionName) {
  let deleted = 0;
  while (true) {
    const result = await pb.collection(collectionName).getList(1, 200);
    if (result.items.length === 0) break;
    for (const r of result.items) {
      await pb.collection(collectionName).delete(r.id);
      deleted++;
    }
  }
  return deleted;
}

async function main() {
  // ── Authenticate as superuser ──
  console.log("Authenticating as superuser...");
  await pb.collection("_superusers").authWithPassword(
    "tzuchi.webit@gmail.com",
    "@Tcf94800552"
  );
  console.log("Authenticated!");

  // ── Clean existing data ──
  console.log("\nCleaning existing data...");
  for (const col of ["session_speakers", "papers", "sessions", "days", "speakers", "venues", "exhibitions", "site_settings"]) {
    const count = await deleteAllNoFilter(col);
    if (count > 0) console.log(`  Deleted ${count} records from ${col}`);
  }
  console.log("Cleanup complete.");

  // ── Create speakers ──
  const speakerData = [
    { name: "Rey-Sheng Her", nameCn: "何日生", affiliation: "慈濟基金會", title_field: "Deputy CEO", sortOrder: 1 },
    { name: "Stephen Teiser", nameCn: null, affiliation: "Princeton University", title_field: "Professor", sortOrder: 2 },
    { name: "Jiade Shao", nameCn: "邵嘉德", affiliation: null, title_field: null, sortOrder: 3 },
    { name: "Amwu Lin", nameCn: "林安梧", affiliation: null, title_field: null, sortOrder: 4 },
    { name: "Jonathan Gold", nameCn: null, affiliation: null, title_field: null, sortOrder: 5 },
    { name: "Pierce Salguero", nameCn: null, affiliation: null, title_field: null, sortOrder: 6 },
    { name: "Mayfair Yang", nameCn: null, affiliation: null, title_field: null, sortOrder: 7 },
    { name: "James Robson", nameCn: null, affiliation: null, title_field: null, sortOrder: 8 },
    { name: "Brooke Lavelle", nameCn: null, affiliation: null, title_field: null, sortOrder: 9 },
    { name: "Chien-te Lin", nameCn: "林建德", affiliation: "慈濟大學", title_field: "宗教與人文研究所教授", sortOrder: 10 },
    { name: "Weijen Teng", nameCn: "鄧偉仁", affiliation: null, title_field: null, sortOrder: 11 },
    { name: "Justin Ritzinger", nameCn: null, affiliation: null, title_field: null, sortOrder: 12 },
    { name: "Kate Crosby", nameCn: null, affiliation: null, title_field: null, sortOrder: 13 },
    { name: "Yu-chen Li", nameCn: "李玉珍", affiliation: null, title_field: null, sortOrder: 14 },
    { name: "Pei-ying Lin", nameCn: "林佩瑩", affiliation: null, title_field: null, sortOrder: 15 },
    { name: "Julia Huang", nameCn: "黃倩玉", affiliation: null, title_field: null, sortOrder: 16 },
    { name: "William McGrath", nameCn: null, affiliation: null, title_field: null, sortOrder: 17 },
    { name: "Yinggang Sun", nameCn: "孫英剛", affiliation: null, title_field: null, sortOrder: 18 },
    { name: "Jianming He", nameCn: "何建明", affiliation: null, title_field: null, sortOrder: 19 },
    { name: "Parimal Patil", nameCn: null, affiliation: null, title_field: null, sortOrder: 20 },
    { name: "Elise Anne DeVido", nameCn: null, affiliation: null, title_field: null, sortOrder: 21 },
    { name: "Tjhin Hong Lin", nameCn: null, affiliation: null, title_field: null, sortOrder: 22 },
    { name: "Debby Lee", nameCn: null, affiliation: null, title_field: null, sortOrder: 23 },
    { name: "Wen-liang Zhang", nameCn: null, affiliation: null, title_field: null, sortOrder: 24 },
    { name: "Monica Sanford", nameCn: null, affiliation: null, title_field: null, sortOrder: 25 },
    { name: "William Yau Nang Ng", nameCn: null, affiliation: null, title_field: null, sortOrder: 26 },
    { name: "Weishan Huang", nameCn: null, affiliation: null, title_field: null, sortOrder: 27 },
    { name: "Jiangang Zhu", nameCn: null, affiliation: null, title_field: null, sortOrder: 28 },
    { name: "Yining Liu", nameCn: null, affiliation: null, title_field: null, sortOrder: 29 },
    { name: "Megan Bryson", nameCn: null, affiliation: null, title_field: null, sortOrder: 30 },
    { name: "Eugene Wang", nameCn: "汪悅進", affiliation: "Harvard", title_field: null, sortOrder: 31 },
    { name: "Melissa McCormick", nameCn: null, affiliation: "Harvard", title_field: null, sortOrder: 32 },
    { name: "Sonya Lee", nameCn: null, affiliation: "USC", title_field: null, sortOrder: 33 },
    { name: "Anthony Dunne", nameCn: null, affiliation: "The New School", title_field: null, sortOrder: 34 },
    { name: "Fiona Raby", nameCn: null, affiliation: "The New School", title_field: null, sortOrder: 35 },
    { name: "James Auger", nameCn: null, affiliation: "RMIT", title_field: null, sortOrder: 36 },
    { name: "Allen Sayegh", nameCn: null, affiliation: "Harvard GSD", title_field: null, sortOrder: 37 },
    { name: "Sheila Kennedy", nameCn: null, affiliation: "MIT", title_field: null, sortOrder: 38 },
    { name: "Jungyoon Kim", nameCn: null, affiliation: "Harvard GSD", title_field: null, sortOrder: 39 },
    { name: "Goh Yu Han", nameCn: null, affiliation: "SALAD Dressing", title_field: null, sortOrder: 40 },
    { name: "Chang Huai Yan", nameCn: null, affiliation: "SALAD Dressing", title_field: null, sortOrder: 41 },
    { name: "Monique Mead", nameCn: null, affiliation: "Carnegie Mellon University", title_field: null, sortOrder: 42 },
    { name: "Cuilian Liu", nameCn: null, affiliation: "University of Pittsburgh", title_field: null, sortOrder: 43 },
    { name: "Chenchen Lu", nameCn: null, affiliation: "Harvard CAMLab", title_field: null, sortOrder: 44 },
  ];

  console.log("Creating 44 speakers...");
  const speakers = {};
  for (const s of speakerData) {
    const data = {
      site: SITE_ID,
      name: s.name,
      nameCn: s.nameCn || "",
      affiliation: s.affiliation || "",
      title_field: s.title_field || "",
      status: "confirmed",
      sortOrder: s.sortOrder,
    };
    const created = await pb.collection("speakers").create(data);
    speakers[s.name] = created.id;
    console.log(`  Speaker: ${s.name} -> ${created.id}`);
  }
  console.log(`Created ${Object.keys(speakers).length} speakers.`);

  // ── Create days ──
  console.log("Creating 5 days...");
  const daysData = [
    { dayNumber: 1, date: "2026-05-05", titleZh: "明心展覽開幕", titleEn: "Opening Ceremony of \"Journey to Enlightenment\"" },
    { dayNumber: 2, date: "2026-05-06", titleZh: "明心展覽導覽", titleEn: "\"Journey to Enlightenment\" Exhibition Tour" },
    { dayNumber: 3, date: "2026-05-07", titleZh: "應用佛教與菩薩道", titleEn: "Applied Buddhism and the Bodhisattva Path" },
    { dayNumber: 4, date: "2026-05-08", titleZh: "證嚴上人思想與領導力", titleEn: "Venerable Cheng Yen's Philosophy and Leadership" },
    { dayNumber: 5, date: "2026-05-09", titleZh: "佛教之後的設計未來", titleEn: "Design Futures after Buddhism: Worldmaking by Other Means" },
  ];

  const days = {};
  for (const d of daysData) {
    const created = await pb.collection("days").create({
      site: SITE_ID,
      dayNumber: d.dayNumber,
      date: d.date,
      titleZh: d.titleZh,
      titleEn: d.titleEn,
    });
    days[d.dayNumber] = created.id;
    console.log(`  Day ${d.dayNumber}: ${created.id}`);
  }
  console.log("Created 5 days.");

  // ── Helper to create a session ──
  async function createSession(dayNum, data) {
    const rec = await pb.collection("sessions").create({
      day: days[dayNum],
      type: data.type,
      titleZh: data.titleZh || "",
      titleEn: data.titleEn || "",
      subtitleZh: data.subtitleZh || "",
      subtitleEn: data.subtitleEn || "",
      startTime: data.startTime || "",
      duration: data.duration || 0,
      venue: data.venue || "",
      sortOrder: data.sortOrder,
    });
    console.log(`  Session: ${data.titleEn} -> ${rec.id}`);
    return rec.id;
  }

  // ── Helper to create session_speaker ──
  async function createSessionSpeaker(sessionId, speakerName, role) {
    await pb.collection("session_speakers").create({
      session: sessionId,
      speaker: speakers[speakerName],
      role: role,
    });
    console.log(`    SessionSpeaker: ${speakerName} (${role})`);
  }

  // ── Helper to create paper ──
  async function createPaper(sessionId, speakerName, data) {
    await pb.collection("papers").create({
      session: sessionId,
      speaker: speakers[speakerName],
      titleZh: data.titleZh || "",
      titleEn: data.titleEn || "",
      status: data.status || "accepted",
      sortOrder: data.sortOrder,
    });
    console.log(`    Paper: ${data.titleEn}`);
  }

  // Counters
  let sessionCount = 0;
  let sessionSpeakerCount = 0;
  let paperCount = 0;

  // ══════════════════════════════════════
  // Day 1 (May 5) - Opening Ceremony
  // ══════════════════════════════════════
  console.log("\nCreating Day 1 sessions...");
  await createSession(1, {
    type: "opening",
    titleZh: "明心展覽開幕典禮",
    titleEn: "Opening Ceremony",
    subtitleEn: "Remarks:\n1. Representative of Harvard University\n2. Representative of Jing Si Monastic\n3. Po-Wen Yen, CEO of Tzu Chi Foundation\n4. Eugene Wang, Director of Harvard CAMLab\n5. Special Guests\n\nIntroduction to Project Journey to Enlightenment",
    startTime: "18:30",
    duration: 60,
    venue: "Harvard Adolphus Busch Hall",
    sortOrder: 1,
  });
  sessionCount++;

  // ══════════════════════════════════════
  // Day 2 (May 6) - Exhibition Tour
  // ══════════════════════════════════════
  console.log("\nCreating Day 2 sessions...");
  await createSession(2, {
    type: "exhibition",
    titleZh: "明心展覽導覽",
    titleEn: "Exhibition Tour",
    subtitleZh: "邀請學者與貴賓參觀「明心」展覽",
    subtitleEn: "Inviting scholars and guests to visit the \"Journey to Enlightenment\" exhibition",
    startTime: "13:30",
    duration: 210,
    venue: "Harvard CAMLab Cave",
    sortOrder: 1,
  });
  sessionCount++;

  // ══════════════════════════════════════
  // Day 3 (May 7) - Applied Buddhism
  // ══════════════════════════════════════
  console.log("\nCreating Day 3 sessions...");

  // Opening Remarks
  const day3opening = await createSession(3, {
    type: "opening",
    titleZh: "開幕致詞",
    titleEn: "Opening Remarks",
    subtitleEn: "1. Representative of Harvard University\n2. Representative of Leading scholars on Buddhism studies\n3. Jing Si Monastic Representative\n4. Representative of Harvard CAMLab\n5. Special Guests",
    startTime: "08:30",
    duration: 50,
    sortOrder: 1,
  });
  sessionCount++;

  // Group Photo
  await createSession(3, {
    type: "photo",
    titleZh: "大合照",
    titleEn: "Group Photo",
    startTime: "09:20",
    duration: 10,
    sortOrder: 2,
  });
  sessionCount++;

  // Keynote Speech I
  const keynote1 = await createSession(3, {
    type: "keynote",
    titleZh: "佛教的當代詮釋：應用佛教的意義",
    titleEn: "Contemporary Interpretations of Buddhism: The Significance of Applied Buddhism",
    subtitleZh: "專題演講 I",
    subtitleEn: "Keynote Speech I",
    startTime: "09:30",
    duration: 30,
    sortOrder: 3,
  });
  sessionCount++;
  await createSessionSpeaker(keynote1, "Rey-Sheng Her", "speaker");
  sessionSpeakerCount++;

  // Break
  await createSession(3, {
    type: "break",
    titleZh: "休息",
    titleEn: "Break",
    startTime: "10:00",
    duration: 20,
    sortOrder: 4,
  });
  sessionCount++;

  // Session I
  const panel1 = await createSession(3, {
    type: "paper_session",
    titleZh: "菩薩道的哲學與倫理基礎",
    titleEn: "Philosophical and Ethical Foundations of the Bodhisattva Path",
    subtitleZh: "場次 I",
    subtitleEn: "Session I",
    startTime: "10:20",
    duration: 130,
    sortOrder: 5,
  });
  sessionCount++;

  await createSessionSpeaker(panel1, "Stephen Teiser", "moderator");
  sessionSpeakerCount++;

  await createPaper(panel1, "Jiade Shao", {
    titleZh: "佛教平等觀的理論意涵與當代意義",
    titleEn: "The Theoretical Implication and Contemporary Significance of the Buddhist Concept of Equality",
    status: "accepted",
    sortOrder: 1,
  });
  paperCount++;

  await createPaper(panel1, "Amwu Lin", {
    titleZh: "融貫無生與活力：慈濟對《無量義經》的實踐詮釋——經由「存有三態論」與儒佛會通",
    titleEn: "Integrating Non-Arising and Vitality: Tzu Chi's Practical Interpretation of Infinite Meanings Sutra — Via \"Trialectics of Being\" and Confucian-Buddhist Convergence",
    status: "accepted",
    sortOrder: 2,
  });
  paperCount++;

  await createPaper(panel1, "Jianming He", {
    titleZh: "證嚴上人的《法華經》釋義與慈濟佛教的形成",
    titleEn: "Venerable Cheng Yen's Exegesis of the Lotus Sutra and the Formation of Tzu Chi Buddhism",
    status: "accepted",
    sortOrder: 3,
  });
  paperCount++;

  await createPaper(panel1, "Jonathan Gold", {
    titleZh: "方便無盡：脅迫、創傷與當代菩薩道",
    titleEn: "Upāya Without Closure: Coercion, Trauma, and the Contemporary Bodhisattva Path",
    status: "accepted",
    sortOrder: 4,
  });
  paperCount++;

  // Session I commentators
  await createSessionSpeaker(panel1, "Parimal Patil", "discussant");
  sessionSpeakerCount++;
  await createSessionSpeaker(panel1, "Kate Crosby", "discussant");
  sessionSpeakerCount++;

  // Lunch
  await createSession(3, {
    type: "break",
    titleZh: "午餐",
    titleEn: "Lunch",
    startTime: "12:30",
    duration: 90,
    sortOrder: 6,
  });
  sessionCount++;

  // Session II
  const panel2 = await createSession(3, {
    type: "paper_session",
    titleZh: "佛教、健康與照護倫理",
    titleEn: "Buddhism, Health, and Ethics of Care",
    subtitleZh: "場次 II",
    subtitleEn: "Session II",
    startTime: "14:00",
    duration: 130,
    sortOrder: 7,
  });
  sessionCount++;

  await createPaper(panel2, "Yinggang Sun", {
    titleZh: "TBD",
    titleEn: "TBD",
    status: "draft",
    sortOrder: 1,
  });
  paperCount++;

  await createPaper(panel2, "William McGrath", {
    titleZh: "從佛陀的醫師到藥師佛",
    titleEn: "From the Buddha's Physician to the Medicine Buddha",
    status: "accepted",
    sortOrder: 2,
  });
  paperCount++;

  await createPaper(panel2, "Pierce Salguero", {
    titleZh: "超越正念：美國的佛教與健康",
    titleEn: "Beyond Mindfulness: Buddhism & Health in the US",
    status: "accepted",
    sortOrder: 3,
  });
  paperCount++;

  await createPaper(panel2, "Mayfair Yang", {
    titleZh: "追逐赤頸鶴：藍毗尼的佛教與印度教多物種群落",
    titleEn: "Chasing the Sarus Cranes: Buddhist and Hindu Multispecies Assemblages in Lumbini",
    status: "accepted",
    sortOrder: 4,
  });
  paperCount++;

  // Jonathan Gold as session speaker (no paper)
  await createSessionSpeaker(panel2, "Jonathan Gold", "speaker");
  sessionSpeakerCount++;

  // Session II commentators
  await createSessionSpeaker(panel2, "James Robson", "discussant");
  sessionSpeakerCount++;
  await createSessionSpeaker(panel2, "Brooke Lavelle", "discussant");
  sessionSpeakerCount++;

  // Break
  await createSession(3, {
    type: "break",
    titleZh: "休息",
    titleEn: "Break",
    startTime: "16:10",
    duration: 20,
    sortOrder: 8,
  });
  sessionCount++;

  // Roundtable I
  const roundtable1 = await createSession(3, {
    type: "roundtable",
    titleZh: "圓桌論壇 I",
    titleEn: "Roundtable I",
    startTime: "16:30",
    duration: 90,
    sortOrder: 9,
  });
  sessionCount++;

  for (const [name, role] of [
    ["James Robson", "moderator"],
    ["Tjhin Hong Lin", "speaker"],
    ["Debby Lee", "speaker"],
    ["Wen-liang Zhang", "speaker"],
    ["Rey-Sheng Her", "speaker"],
    ["Pierce Salguero", "speaker"],
    ["Monica Sanford", "speaker"],
    ["Brooke Lavelle", "speaker"],
  ]) {
    await createSessionSpeaker(roundtable1, name, role);
    sessionSpeakerCount++;
  }

  // Dinner
  await createSession(3, {
    type: "dinner",
    titleZh: "晚宴",
    titleEn: "Dinner",
    venue: "Harvard Faculty Club",
    startTime: "19:00",
    sortOrder: 10,
  });
  sessionCount++;

  // ══════════════════════════════════════
  // Day 4 (May 8) - Cheng Yen's Philosophy
  // ══════════════════════════════════════
  console.log("\nCreating Day 4 sessions...");

  // Keynote Speech II
  const keynote2 = await createSession(4, {
    type: "keynote",
    titleZh: "寺院與瘋人院：近代及當代東亞佛教中精神病患的照護與收容",
    titleEn: "Monasteries & Madhouses: On the Care and Confinement of the Insane in Early Modern and Contemporary East Asian Buddhism",
    subtitleZh: "專題演講 II",
    subtitleEn: "Keynote Speech II",
    startTime: "08:30",
    duration: 30,
    sortOrder: 1,
  });
  sessionCount++;

  await createSessionSpeaker(keynote2, "James Robson", "speaker");
  sessionSpeakerCount++;

  // Session III
  const panel3 = await createSession(4, {
    type: "paper_session",
    titleZh: "《法華經》與證嚴上人思想",
    titleEn: "The Lotus Sutra and the Thought of Master Cheng Yen",
    subtitleZh: "場次 III",
    subtitleEn: "Session III",
    startTime: "09:00",
    duration: 100,
    sortOrder: 2,
  });
  sessionCount++;

  await createSessionSpeaker(panel3, "Parimal Patil", "moderator");
  sessionSpeakerCount++;

  await createPaper(panel3, "Rey-Sheng Her", {
    titleZh: "證嚴上人講述的《法華經》",
    titleEn: "The Lotus Sutra as Taught by Master Cheng Yen",
    status: "accepted",
    sortOrder: 1,
  });
  paperCount++;

  await createPaper(panel3, "Chien-te Lin", {
    titleZh: "從人間佛教到證嚴法師的宗教觀",
    titleEn: "From Humanistic Buddhism to the Perspective of Religion of Dharma Master Cheng Yen",
    status: "accepted",
    sortOrder: 2,
  });
  paperCount++;

  await createPaper(panel3, "Elise Anne DeVido", {
    titleZh: "慈濟教義中的動物報恩",
    titleEn: "Animal Repaying Debts of Gratitude in Tzu Chi Teachings",
    status: "accepted",
    sortOrder: 3,
  });
  paperCount++;

  // Session III commentators
  await createSessionSpeaker(panel3, "Weijen Teng", "discussant");
  sessionSpeakerCount++;
  await createSessionSpeaker(panel3, "Justin Ritzinger", "discussant");
  sessionSpeakerCount++;

  // Break
  await createSession(4, {
    type: "break",
    titleZh: "休息",
    titleEn: "Break",
    startTime: "10:40",
    duration: 20,
    sortOrder: 3,
  });
  sessionCount++;

  // Session IV
  const panel4 = await createSession(4, {
    type: "paper_session",
    titleZh: "慈濟的魅力、實踐與宗教社群",
    titleEn: "Charisma, Practice, and Religious Community in Tzu Chi",
    subtitleZh: "場次 IV",
    subtitleEn: "Session IV",
    startTime: "11:00",
    duration: 100,
    sortOrder: 4,
  });
  sessionCount++;

  await createSessionSpeaker(panel4, "Kate Crosby", "moderator");
  sessionSpeakerCount++;

  await createPaper(panel4, "Yu-chen Li", {
    titleZh: "書寫證嚴上人：以魅力型佛教尼師傳記出版宗教魅力",
    titleEn: "Writing Ven. Cheng Yen: to publishing religious charisma by the biographies of charismatic Buddhist nuns",
    status: "accepted",
    sortOrder: 1,
  });
  paperCount++;

  await createPaper(panel4, "Pei-ying Lin", {
    titleZh: "慈悲網絡：全球化時代的慈濟清修士",
    titleEn: "Compassion Network: The Tzu Chi Pure Practitioners in the Age of Globalisation",
    status: "accepted",
    sortOrder: 2,
  });
  paperCount++;

  await createPaper(panel4, "Julia Huang", {
    titleZh: "當代捨身菩薩：慈濟大體捐贈中的情感、情感實踐與倫理",
    titleEn: "Modern Body-Giving Bodhisattvas: Affect, Emotional Practice, and Ethics in the Whole-Body Donations to Tzu Chi",
    status: "accepted",
    sortOrder: 3,
  });
  paperCount++;

  // Session IV commentators
  await createSessionSpeaker(panel4, "Pierce Salguero", "discussant");
  sessionSpeakerCount++;
  await createSessionSpeaker(panel4, "Jonathan Gold", "discussant");
  sessionSpeakerCount++;

  // Lunch
  await createSession(4, {
    type: "break",
    titleZh: "午餐",
    titleEn: "Lunch",
    startTime: "12:40",
    duration: 80,
    sortOrder: 5,
  });
  sessionCount++;

  // Session V
  const panel5 = await createSession(4, {
    type: "paper_session",
    titleZh: "全球人道主義與入世佛教",
    titleEn: "Global Humanitarianism and Engaged Buddhism",
    subtitleZh: "場次 V",
    subtitleEn: "Session V",
    startTime: "14:00",
    duration: 130,
    sortOrder: 6,
  });
  sessionCount++;

  await createSessionSpeaker(panel5, "Weijen Teng", "moderator");
  sessionSpeakerCount++;

  await createPaper(panel5, "William Yau Nang Ng", {
    titleZh: "重新思考人類安全：慈濟式服務佛教",
    titleEn: "Reconsidering Human Security: Tzu Chi–Style Service Buddhism",
    status: "accepted",
    sortOrder: 1,
  });
  paperCount++;

  await createPaper(panel5, "Weishan Huang", {
    titleZh: "慈悲設計：慈濟科技人道主義的道德生態",
    titleEn: "Compassion by Design: The Moral Ecology of Tzu Chi's Technological Humanitarianism",
    status: "accepted",
    sortOrder: 2,
  });
  paperCount++;

  await createPaper(panel5, "Jiangang Zhu", {
    titleZh: "宗教與志工服務：以中國大陸慈濟志工為個案研究",
    titleEn: "Religion and Volunteerism: A case study on Tzu Chi volunteers in mainland China",
    status: "accepted",
    sortOrder: 3,
  });
  paperCount++;

  await createPaper(panel5, "Yining Liu", {
    titleZh: "人類世中的生態菩薩",
    titleEn: "Eco-Bodhisattvas in the Anthropocene",
    status: "accepted",
    sortOrder: 4,
  });
  paperCount++;

  // Session V commentators
  await createSessionSpeaker(panel5, "Monica Sanford", "discussant");
  sessionSpeakerCount++;
  await createSessionSpeaker(panel5, "Megan Bryson", "discussant");
  sessionSpeakerCount++;

  // Break
  await createSession(4, {
    type: "break",
    titleZh: "休息",
    titleEn: "Break",
    startTime: "16:10",
    duration: 20,
    sortOrder: 7,
  });
  sessionCount++;

  // Roundtable II
  const roundtable2 = await createSession(4, {
    type: "roundtable",
    titleZh: "圓桌論壇 II：佛教的未來",
    titleEn: "Roundtable II: The Future of Buddhism",
    startTime: "16:30",
    duration: 120,
    sortOrder: 8,
  });
  sessionCount++;

  for (const [name, role] of [
    ["Rey-Sheng Her", "moderator"],
    ["Jonathan Gold", "speaker"],
    ["William McGrath", "speaker"],
    ["Yinggang Sun", "speaker"],
    ["Weijen Teng", "speaker"],
    ["Julia Huang", "speaker"],
    ["Kate Crosby", "speaker"],
  ]) {
    await createSessionSpeaker(roundtable2, name, role);
    sessionSpeakerCount++;
  }

  // Dinner
  await createSession(4, {
    type: "dinner",
    titleZh: "晚宴",
    titleEn: "Dinner",
    startTime: "19:00",
    sortOrder: 9,
  });
  sessionCount++;

  // ══════════════════════════════════════
  // Day 5 (May 9) - Design Futures
  // ══════════════════════════════════════
  console.log("\nCreating Day 5 sessions...");

  // Keynote Speech III
  const keynote3 = await createSession(5, {
    type: "keynote",
    titleZh: "專題演講 III",
    titleEn: "Keynote Speech III",
    subtitleZh: "專題演講 III",
    subtitleEn: "Keynote Speech III",
    startTime: "09:00",
    duration: 20,
    sortOrder: 1,
  });
  sessionCount++;

  await createSessionSpeaker(keynote3, "Eugene Wang", "speaker");
  sessionSpeakerCount++;

  // Session VI
  const panel6 = await createSession(5, {
    type: "paper_session",
    titleZh: "佛教世界建構作為概念框架",
    titleEn: "Buddhist Worldmaking as Conceptual Framework",
    subtitleZh: "場次 VI",
    subtitleEn: "Session VI",
    startTime: "09:20",
    duration: 75,
    sortOrder: 2,
  });
  sessionCount++;

  await createSessionSpeaker(panel6, "Eugene Wang", "moderator");
  sessionSpeakerCount++;

  await createPaper(panel6, "Melissa McCormick", {
    titleZh: "TBD",
    titleEn: "TBD",
    status: "draft",
    sortOrder: 1,
  });
  paperCount++;

  await createPaper(panel6, "Sonya Lee", {
    titleZh: "回收再利用的精神：通過複製保存佛教壁畫",
    titleEn: "In the Spirit of Recycle and Reuse: Preserving Buddhist Wall Painting through Replication",
    status: "accepted",
    sortOrder: 2,
  });
  paperCount++;

  // Break
  await createSession(5, {
    type: "break",
    titleZh: "休息",
    titleEn: "Break",
    startTime: "10:35",
    duration: 15,
    sortOrder: 3,
  });
  sessionCount++;

  // Session VII
  const panel7 = await createSession(5, {
    type: "paper_session",
    titleZh: "推測性設計與替代未來",
    titleEn: "Speculative Design and Alternative Futures",
    subtitleZh: "場次 VII",
    subtitleEn: "Session VII",
    startTime: "10:50",
    duration: 90,
    sortOrder: 4,
  });
  sessionCount++;

  await createSessionSpeaker(panel7, "Anthony Dunne", "moderator");
  sessionSpeakerCount++;

  for (const name of ["Fiona Raby", "James Auger", "Allen Sayegh"]) {
    await createSessionSpeaker(panel7, name, "speaker");
    sessionSpeakerCount++;
  }

  // Lunch
  await createSession(5, {
    type: "break",
    titleZh: "午餐",
    titleEn: "Lunch",
    startTime: "12:20",
    duration: 60,
    sortOrder: 5,
  });
  sessionCount++;

  // Session VIII
  const panel8 = await createSession(5, {
    type: "paper_session",
    titleZh: "建築、生態與系統思維",
    titleEn: "Architecture, Ecology, and Systems Thinking",
    subtitleZh: "場次 VIII",
    subtitleEn: "Session VIII",
    startTime: "13:20",
    duration: 75,
    sortOrder: 6,
  });
  sessionCount++;

  await createSessionSpeaker(panel8, "Sheila Kennedy", "moderator");
  sessionSpeakerCount++;

  await createPaper(panel8, "Jungyoon Kim", {
    titleZh: "TBD",
    titleEn: "TBD",
    status: "draft",
    sortOrder: 1,
  });
  paperCount++;

  await createPaper(panel8, "Goh Yu Han", {
    titleZh: "TBD",
    titleEn: "TBD",
    status: "draft",
    sortOrder: 2,
  });
  paperCount++;

  // Chang Huai Yan co-presenter
  await createSessionSpeaker(panel8, "Chang Huai Yan", "speaker");
  sessionSpeakerCount++;

  // Break
  await createSession(5, {
    type: "break",
    titleZh: "休息",
    titleEn: "Break",
    startTime: "14:35",
    duration: 15,
    sortOrder: 7,
  });
  sessionCount++;

  // Session IX
  const panel9 = await createSession(5, {
    type: "paper_session",
    titleZh: "心靈、中介與多感官體驗",
    titleEn: "Mind, Mediation, and Multisensorial Experience",
    subtitleZh: "場次 IX",
    subtitleEn: "Session IX",
    startTime: "14:50",
    duration: 75,
    sortOrder: 8,
  });
  sessionCount++;

  await createSessionSpeaker(panel9, "Monique Mead", "moderator");
  sessionSpeakerCount++;

  await createPaper(panel9, "Cuilian Liu", {
    titleZh: "TBD",
    titleEn: "TBD",
    status: "draft",
    sortOrder: 1,
  });
  paperCount++;

  await createPaper(panel9, "Chenchen Lu", {
    titleZh: "TBD",
    titleEn: "TBD",
    status: "draft",
    sortOrder: 2,
  });
  paperCount++;

  // Break
  await createSession(5, {
    type: "break",
    titleZh: "休息",
    titleEn: "Break",
    startTime: "16:05",
    duration: 15,
    sortOrder: 9,
  });
  sessionCount++;

  // Final Roundtable
  await createSession(5, {
    type: "roundtable",
    titleZh: "「佛教之後的設計」意味著什麼？",
    titleEn: "What Does It Mean to Design 'After Buddhism'?",
    subtitleZh: "最終圓桌論壇",
    subtitleEn: "Final Roundtable",
    startTime: "16:20",
    duration: 40,
    sortOrder: 10,
  });
  sessionCount++;

  // Closing
  await createSession(5, {
    type: "closing",
    titleZh: "閉幕",
    titleEn: "Closing",
    startTime: "17:00",
    duration: 10,
    sortOrder: 11,
  });
  sessionCount++;

  // Dinner
  await createSession(5, {
    type: "dinner",
    titleZh: "晚宴",
    titleEn: "Dinner",
    startTime: "17:15",
    duration: 75,
    sortOrder: 12,
  });
  sessionCount++;

  // Concert
  await createSession(5, {
    type: "exhibition",
    titleZh: "音樂會：同一片天空下",
    titleEn: "Concert: Under One Sky",
    venue: "Main Hall at Harvard Art Museum",
    startTime: "19:00",
    duration: 120,
    sortOrder: 13,
  });
  sessionCount++;

  // ── Venues ──
  console.log("\nCreating 3 venues...");
  const venuesData = [
    {
      name: "Student Organization Center at Hilles (SOCH)",
      nameZh: "哈佛大學學生社團中心",
      description: "學術發表、論壇及交流活動之主場地。",
      descriptionEn: "Main venue for academic presentations, forums, and networking events.",
      address: "59 Shepard St, Cambridge, MA 02138",
      type: "main",
      image: "/img/soch.webp",
    },
    {
      name: "Harvard CAMLab Cave",
      nameZh: "哈佛 CAMLab 洞窟",
      description: "「明心」沉浸式展覽場地。",
      descriptionEn: "Venue for the \"Journey to Enlightenment\" immersive exhibition.",
      address: "Adolphus Busch Hall, 29 Kirkland St, Cambridge, MA 02138",
      type: "exhibition",
    },
    {
      name: "Harvard Adolphus Busch Hall",
      nameZh: "哈佛 Adolphus Busch Hall",
      description: "明心展覽開幕典禮場地。",
      descriptionEn: "Venue for the Journey to Enlightenment exhibition opening ceremony.",
      address: "29 Kirkland St, Cambridge, MA 02138",
      type: "exhibition",
      image: "/img/hall.jpg",
    },
  ];

  for (const v of venuesData) {
    await pb.collection("venues").create({
      site: SITE_ID,
      name: v.name,
      nameZh: v.nameZh || "",
      description: v.description || "",
      descriptionEn: v.descriptionEn || "",
      address: v.address || "",
      type: v.type || "",
    });
    console.log(`  Venue: ${v.name}`);
  }

  // ── Exhibition ──
  console.log("\nCreating 1 exhibition...");
  await pb.collection("exhibitions").create({
    site: SITE_ID,
    titleZh: "明心",
    titleEn: "Journey to Enlightenment",
    description: "由哈佛大學CAMLab策劃，結合沉浸式藝術體驗，引領觀者走入佛教藝術與靜思法脈的精神之旅。",
    startDate: "2026-05-05",
    endDate: "2026-05-09",
    venue: "Harvard CAMLab Cave",
  });
  console.log("  Exhibition: Journey to Enlightenment");

  // ── Site Settings ──
  console.log("\nCreating site_settings...");
  const descSettings = [
    { key: "description_headline", value: "一場探索佛教未來的學術盛會" },
    { key: "description_headline_en", value: "An Academic Symposium Exploring the Future of Buddhism" },
    { key: "description_body", value: "「全球共善學思會」匯聚國際佛學研究者、宗教實踐者與人文學者，以學術發表、圓桌論壇與沉浸式藝術體驗，深入探討應用佛教、菩薩道精神與佛教藝術的當代轉譯。本次學思會由慈濟基金會與哈佛大學 CAMLab 共同主辦，期盼在學術對話中，為佛教的未來開展新的視野與可能。" },
    { key: "description_body_en", value: "The Tzu Chi Global Symposium brings together international Buddhist scholars, religious practitioners, and humanities researchers for academic presentations, roundtable discussions, and immersive art experiences. Co-hosted by the Tzu Chi Foundation and Harvard University's CAMLab, this symposium explores applied Buddhism, the Bodhisattva path, and the contemporary translation of Buddhist art." },
    { key: "description_highlights", value: JSON.stringify([
      { icon: "BookOpen", label: "6 場學術論文發表", labelEn: "6 Paper Sessions" },
      { icon: "Lightbulb", label: "2 場圓桌論壇對話", labelEn: "2 Roundtable Discussions" },
      { icon: "Users", label: "18 位國際學者", labelEn: "18 International Scholars" },
      { icon: "Eye", label: "1 場沉浸式展覽", labelEn: "1 Immersive Exhibition" },
    ]) },
    { key: "tour_header", value: "每梯次七十五分鐘\n三梯次，每梯次二十人" },
    { key: "tour_header_en", value: "75 minutes per group\n3 groups, 20 people each" },
    { key: "tour_groups", value: JSON.stringify([
      { number: "01", title: "慈濟台灣與美國志工", titleEn: "Tzu Chi Volunteers (TW & US)", sub: "二十人一梯次，75 分鐘", subEn: "20 per group, 75 min", tag: "中文導覽", tagEn: "Chinese Tour" },
      { number: "02", title: "大陸與台灣學者貴賓", titleEn: "Scholars & VIPs (CN & TW)", sub: "二十人一梯次，75 分鐘", subEn: "20 per group, 75 min", tag: "中文導覽", tagEn: "Chinese Tour" },
      { number: "03", title: "歐美貴賓與學者", titleEn: "International Scholars & VIPs", sub: "二十人一梯次，75 分鐘", subEn: "20 per group, 75 min", tag: "英文導覽", tagEn: "English Tour" },
    ]) },
    { key: "organizers", value: "慈濟基金會 · Harvard CAMLab" },
    { key: "copyright", value: "慈濟基金會 版權所有" },
    { key: "banner_image", value: "/img/about-banner.jpg" },
    { key: "og_title", value: "慈濟全球共善學思會" },
    { key: "og_title_en", value: "Tzu Chi Global Symposium for Common Goodness" },
    { key: "og_description", value: "應用佛法與當代菩薩道：前瞻佛教的未來 · 2026年5月5日─9日 · 哈佛大學" },
    { key: "og_description_en", value: "Applied Buddhism and Contemporary Bodhisattva Path: Exploring the Future of Buddhism · May 5-9, 2026 · Harvard University" },
    { key: "og_image", value: "/img/about-banner.jpg" },
    { key: "speakers_subtitle", value: "來自世界各地的傑出學者與實踐者，共同分享佛教的當代智慧與願景。" },
    { key: "speakers_subtitle_en", value: "Distinguished scholars and practitioners from around the world, sharing contemporary Buddhist wisdom and vision." },
    { key: "site_language", value: "both" },
  ];

  let settingsCount = 0;
  for (const s of descSettings) {
    await pb.collection("site_settings").create({
      site: SITE_ID,
      key: s.key,
      value: s.value,
    });
    settingsCount++;
    console.log(`  Setting: ${s.key}`);
  }

  // ── Summary ──
  console.log("\n══════════════════════════════════════");
  console.log("SEED COMPLETE!");
  console.log("══════════════════════════════════════");
  console.log(`Speakers:         44`);
  console.log(`Days:             5`);
  console.log(`Sessions:         ${sessionCount}`);
  console.log(`Session Speakers: ${sessionSpeakerCount}`);
  console.log(`Papers:           ${paperCount}`);
  console.log(`Venues:           3`);
  console.log(`Exhibitions:      1`);
  console.log(`Site Settings:    ${settingsCount}`);
}

main().catch((e) => {
  console.error("SEED FAILED:", e);
  process.exit(1);
});
