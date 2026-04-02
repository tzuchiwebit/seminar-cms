import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── Clean existing data ──
  await prisma.sessionSpeaker.deleteMany();
  await prisma.paper.deleteMany();
  await prisma.session.deleteMany();
  await prisma.day.deleteMany();
  await prisma.speaker.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.exhibition.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.upload.deleteMany();
  await prisma.site.deleteMany();

  // ── Create site ──
  const site = await prisma.site.create({
    data: {
      name: "全球共善學思會",
      slug: "symposium",
      domain: null,
      status: "published",
    },
  });

  // ── Create admin user (upsert to avoid duplicate) ──
  await prisma.user.upsert({
    where: { email: "admin@tzuchi.org.tw" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@tzuchi.org.tw",
      password: "admin123",
      role: "admin",
    },
  });

  // ── Create speakers ──
  const speakerData = [
    { name: "Rey-Sheng Her", nameCn: "何日生", affiliation: "慈濟基金會", title: "Deputy CEO", sortOrder: 1 },
    { name: "Stephen Teiser", nameCn: null, affiliation: "Princeton University", title: "Professor", sortOrder: 2 },
    { name: "Jiade Shao", nameCn: "邵嘉德", affiliation: null, title: null, sortOrder: 3 },
    { name: "Amwu Lin", nameCn: "林安梧", affiliation: null, title: null, sortOrder: 4 },
    { name: "Jonathan Gold", nameCn: null, affiliation: null, title: null, sortOrder: 5 },
    { name: "Pierce Salguero", nameCn: null, affiliation: null, title: null, sortOrder: 6 },
    { name: "Mayfair Yang", nameCn: null, affiliation: null, title: null, sortOrder: 7 },
    { name: "James Robson", nameCn: null, affiliation: null, title: null, sortOrder: 8 },
    { name: "Brooke Lavelle", nameCn: null, affiliation: null, title: null, sortOrder: 9 },
    { name: "Chien-te Lin", nameCn: "林建德", affiliation: "慈濟大學", title: "宗教與人文研究所教授", sortOrder: 10 },
    { name: "Weijen Teng", nameCn: "鄧偉仁", affiliation: null, title: null, sortOrder: 11 },
    { name: "Justin Ritzinger", nameCn: null, affiliation: null, title: null, sortOrder: 12 },
    { name: "Kate Crosby", nameCn: null, affiliation: null, title: null, sortOrder: 13 },
    { name: "Yu-chen Li", nameCn: "李玉珍", affiliation: null, title: null, sortOrder: 14 },
    { name: "Pei-ying Lin", nameCn: "林佩瑩", affiliation: null, title: null, sortOrder: 15 },
    { name: "Julia Huang", nameCn: "黃倩玉", affiliation: null, title: null, sortOrder: 16 },
    { name: "William McGrath", nameCn: null, affiliation: null, title: null, sortOrder: 17 },
    { name: "Yinggang Sun", nameCn: "孫英剛", affiliation: null, title: null, sortOrder: 18 },
    // New speakers from PDF
    { name: "Jianming He", nameCn: "何建明", affiliation: null, title: null, sortOrder: 19 },
    { name: "Parimal Patil", nameCn: null, affiliation: null, title: null, sortOrder: 20 },
    { name: "Elise Anne DeVido", nameCn: null, affiliation: null, title: null, sortOrder: 21 },
    { name: "Tjhin Hong Lin", nameCn: null, affiliation: null, title: null, sortOrder: 22 },
    { name: "Debby Lee", nameCn: null, affiliation: null, title: null, sortOrder: 23 },
    { name: "Wen-liang Zhang", nameCn: null, affiliation: null, title: null, sortOrder: 24 },
    { name: "Monica Sanford", nameCn: null, affiliation: null, title: null, sortOrder: 25 },
    { name: "William Yau Nang Ng", nameCn: null, affiliation: null, title: null, sortOrder: 26 },
    { name: "Weishan Huang", nameCn: null, affiliation: null, title: null, sortOrder: 27 },
    { name: "Jiangang Zhu", nameCn: null, affiliation: null, title: null, sortOrder: 28 },
    { name: "Yining Liu", nameCn: null, affiliation: null, title: null, sortOrder: 29 },
    { name: "Megan Bryson", nameCn: null, affiliation: null, title: null, sortOrder: 30 },
    { name: "Eugene Wang", nameCn: "汪悅進", affiliation: "Harvard", title: null, sortOrder: 31 },
    { name: "Melissa McCormick", nameCn: null, affiliation: "Harvard", title: null, sortOrder: 32 },
    { name: "Sonya Lee", nameCn: null, affiliation: "USC", title: null, sortOrder: 33 },
    { name: "Anthony Dunne", nameCn: null, affiliation: "The New School", title: null, sortOrder: 34 },
    { name: "Fiona Raby", nameCn: null, affiliation: "The New School", title: null, sortOrder: 35 },
    { name: "James Auger", nameCn: null, affiliation: "RMIT", title: null, sortOrder: 36 },
    { name: "Allen Sayegh", nameCn: null, affiliation: "Harvard GSD", title: null, sortOrder: 37 },
    { name: "Sheila Kennedy", nameCn: null, affiliation: "MIT", title: null, sortOrder: 38 },
    { name: "Jungyoon Kim", nameCn: null, affiliation: "Harvard GSD", title: null, sortOrder: 39 },
    { name: "Goh Yu Han", nameCn: null, affiliation: "SALAD Dressing", title: null, sortOrder: 40 },
    { name: "Chang Huai Yan", nameCn: null, affiliation: "SALAD Dressing", title: null, sortOrder: 41 },
    { name: "Monique Mead", nameCn: null, affiliation: "Carnegie Mellon University", title: null, sortOrder: 42 },
    { name: "Cuilian Liu", nameCn: null, affiliation: "University of Pittsburgh", title: null, sortOrder: 43 },
    { name: "Chenchen Lu", nameCn: null, affiliation: "Harvard CAMLab", title: null, sortOrder: 44 },
  ];

  const speakers: Record<string, { id: number }> = {};
  for (const s of speakerData) {
    const created = await prisma.speaker.create({
      data: {
        siteId: site.id,
        name: s.name,
        nameCn: s.nameCn,
        affiliation: s.affiliation,
        title: s.title,
        status: "confirmed",
        sortOrder: s.sortOrder,
      },
    });
    speakers[s.name] = created;
  }

  // ── Create days ──
  const day1 = await prisma.day.create({
    data: {
      siteId: site.id,
      dayNumber: 1,
      date: new Date("2026-05-05"),
      titleZh: "明心展覽開幕",
      titleEn: "Opening Ceremony of \"Journey to Enlightenment\"",
    },
  });

  const day2 = await prisma.day.create({
    data: {
      siteId: site.id,
      dayNumber: 2,
      date: new Date("2026-05-06"),
      titleZh: "明心展覽導覽",
      titleEn: "\"Journey to Enlightenment\" Exhibition Tour",
    },
  });

  const day3 = await prisma.day.create({
    data: {
      siteId: site.id,
      dayNumber: 3,
      date: new Date("2026-05-07"),
      titleZh: "應用佛教與菩薩道",
      titleEn: "Applied Buddhism and the Bodhisattva Path",
    },
  });

  const day4 = await prisma.day.create({
    data: {
      siteId: site.id,
      dayNumber: 4,
      date: new Date("2026-05-08"),
      titleZh: "證嚴上人思想與領導力",
      titleEn: "Venerable Cheng Yen's Philosophy and Leadership",
    },
  });

  const day5 = await prisma.day.create({
    data: {
      siteId: site.id,
      dayNumber: 5,
      date: new Date("2026-05-09"),
      titleZh: "佛教之後的設計未來",
      titleEn: "Design Futures after Buddhism: Worldmaking by Other Means",
    },
  });

  // ══════════════════════════════════════
  // Day 1 (May 5, Tue) — Opening Ceremony
  // ══════════════════════════════════════
  await prisma.session.create({
    data: {
      dayId: day1.id,
      type: "opening",
      titleZh: "明心展覽開幕典禮",
      titleEn: "Opening Ceremony",
      subtitleEn: "Remarks:\n1. Representative of Harvard University\n2. Representative of Jing Si Monastic\n3. Po-Wen Yen, CEO of Tzu Chi Foundation\n4. Eugene Wang, Director of Harvard CAMLab\n5. Special Guests\n\nIntroduction to Project Journey to Enlightenment",
      startTime: "18:30",
      duration: 60,
      venue: "Harvard Adolphus Busch Hall",
      sortOrder: 1,
    },
  });

  // ══════════════════════════════════════
  // Day 2 (May 6, Wed) — Exhibition Tour
  // ══════════════════════════════════════
  await prisma.session.create({
    data: {
      dayId: day2.id,
      type: "exhibition",
      titleZh: "明心展覽導覽",
      titleEn: "Exhibition Tour",
      subtitleZh: "邀請學者與貴賓參觀「明心」展覽",
      subtitleEn: "Inviting scholars and guests to visit the \"Journey to Enlightenment\" exhibition",
      startTime: "13:30",
      duration: 210,
      venue: "Harvard CAMLab Cave",
      sortOrder: 1,
    },
  });

  // ══════════════════════════════════════
  // Day 3 (May 7, Thu) — Applied Buddhism
  // ══════════════════════════════════════

  // Opening Remarks
  const day3opening = await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "opening",
      titleZh: "開幕致詞",
      titleEn: "Opening Remarks",
      subtitleEn: "1. Representative of Harvard University\n2. Representative of Leading scholars on Buddhism studies\n3. Jing Si Monastic Representative\n4. Representative of Harvard CAMLab\n5. Special Guests",
      startTime: "08:30",
      duration: 50,
      sortOrder: 1,
    },
  });

  // Group Photo
  await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "photo",
      titleZh: "大合照",
      titleEn: "Group Photo",
      startTime: "09:20",
      duration: 10,
      sortOrder: 2,
    },
  });

  // Keynote Speech I
  const keynote1 = await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "keynote",
      titleZh: "佛教的當代詮釋：應用佛教的意義",
      titleEn: "Contemporary Interpretations of Buddhism: The Significance of Applied Buddhism",
      subtitleZh: "專題演講 I",
      subtitleEn: "Keynote Speech I",
      startTime: "09:30",
      duration: 30,
      sortOrder: 3,
    },
  });

  await prisma.sessionSpeaker.create({
    data: { sessionId: keynote1.id, speakerId: speakers["Rey-Sheng Her"].id, role: "speaker" },
  });

  // Break
  await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "break",
      titleZh: "休息",
      titleEn: "Break",
      startTime: "10:00",
      duration: 20,
      sortOrder: 4,
    },
  });

  // Session I
  const panel1 = await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "paper_session",
      titleZh: "菩薩道的哲學與倫理基礎",
      titleEn: "Philosophical and Ethical Foundations of the Bodhisattva Path",
      subtitleZh: "場次 I",
      subtitleEn: "Session I",
      startTime: "10:20",
      duration: 130,
      sortOrder: 5,
    },
  });

  await prisma.sessionSpeaker.create({
    data: { sessionId: panel1.id, speakerId: speakers["Stephen Teiser"].id, role: "moderator" },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel1.id,
      speakerId: speakers["Jiade Shao"].id,
      titleZh: "佛教平等觀的理論意涵與當代意義",
      titleEn: "The Theoretical Implication and Contemporary Significance of the Buddhist Concept of Equality",
      status: "accepted",
      sortOrder: 1,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel1.id,
      speakerId: speakers["Amwu Lin"].id,
      titleZh: "融貫無生與活力：慈濟對《無量義經》的實踐詮釋——經由「存有三態論」與儒佛會通",
      titleEn: "Integrating Non-Arising and Vitality: Tzu Chi's Practical Interpretation of Infinite Meanings Sutra — Via \"Trialectics of Being\" and Confucian-Buddhist Convergence",
      status: "accepted",
      sortOrder: 2,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel1.id,
      speakerId: speakers["Jianming He"].id,
      titleZh: "證嚴上人的《法華經》釋義與慈濟佛教的形成",
      titleEn: "Venerable Cheng Yen's Exegesis of the Lotus Sutra and the Formation of Tzu Chi Buddhism",
      status: "accepted",
      sortOrder: 3,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel1.id,
      speakerId: speakers["Jonathan Gold"].id,
      titleZh: "方便無盡：脅迫、創傷與當代菩薩道",
      titleEn: "Upāya Without Closure: Coercion, Trauma, and the Contemporary Bodhisattva Path",
      status: "accepted",
      sortOrder: 4,
    },
  });

  // Session I commentators
  await prisma.sessionSpeaker.createMany({
    data: [
      { sessionId: panel1.id, speakerId: speakers["Parimal Patil"].id, role: "discussant" },
      { sessionId: panel1.id, speakerId: speakers["Kate Crosby"].id, role: "discussant" },
    ],
  });

  // Lunch
  await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "break",
      titleZh: "午餐",
      titleEn: "Lunch",
      startTime: "12:30",
      duration: 90,
      sortOrder: 6,
    },
  });

  // Session II
  const panel2 = await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "paper_session",
      titleZh: "佛教、健康與照護倫理",
      titleEn: "Buddhism, Health, and Ethics of Care",
      subtitleZh: "場次 II",
      subtitleEn: "Session II",
      startTime: "14:00",
      duration: 130,
      sortOrder: 7,
    },
  });

  // Yinggang Sun - TBD paper
  await prisma.paper.create({
    data: {
      sessionId: panel2.id,
      speakerId: speakers["Yinggang Sun"].id,
      titleZh: "TBD",
      titleEn: "TBD",
      status: "draft",
      sortOrder: 1,
    },
  });

  // William McGrath paper (was previously attributed to Jonathan Gold)
  await prisma.paper.create({
    data: {
      sessionId: panel2.id,
      speakerId: speakers["William McGrath"].id,
      titleZh: "從佛陀的醫師到藥師佛",
      titleEn: "From the Buddha's Physician to the Medicine Buddha",
      status: "accepted",
      sortOrder: 2,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel2.id,
      speakerId: speakers["Pierce Salguero"].id,
      titleZh: "超越正念：美國的佛教與健康",
      titleEn: "Beyond Mindfulness: Buddhism & Health in the US",
      status: "accepted",
      sortOrder: 3,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel2.id,
      speakerId: speakers["Mayfair Yang"].id,
      titleZh: "追逐赤頸鶴：藍毗尼的佛教與印度教多物種群落",
      titleEn: "Chasing the Sarus Cranes: Buddhist and Hindu Multispecies Assemblages in Lumbini",
      status: "accepted",
      sortOrder: 4,
    },
  });

  // Jonathan Gold as session speaker (no paper title)
  await prisma.sessionSpeaker.create({
    data: { sessionId: panel2.id, speakerId: speakers["Jonathan Gold"].id, role: "speaker" },
  });

  // Session II commentators
  await prisma.sessionSpeaker.createMany({
    data: [
      { sessionId: panel2.id, speakerId: speakers["James Robson"].id, role: "discussant" },
      { sessionId: panel2.id, speakerId: speakers["Brooke Lavelle"].id, role: "discussant" },
    ],
  });

  // Break
  await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "break",
      titleZh: "休息",
      titleEn: "Break",
      startTime: "16:10",
      duration: 20,
      sortOrder: 8,
    },
  });

  // Roundtable I
  const roundtable1 = await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "roundtable",
      titleZh: "圓桌論壇 I",
      titleEn: "Roundtable I",
      startTime: "16:30",
      duration: 90,
      sortOrder: 9,
    },
  });

  await prisma.sessionSpeaker.createMany({
    data: [
      { sessionId: roundtable1.id, speakerId: speakers["James Robson"].id, role: "moderator" },
      { sessionId: roundtable1.id, speakerId: speakers["Tjhin Hong Lin"].id, role: "speaker" },
      { sessionId: roundtable1.id, speakerId: speakers["Debby Lee"].id, role: "speaker" },
      { sessionId: roundtable1.id, speakerId: speakers["Wen-liang Zhang"].id, role: "speaker" },
      { sessionId: roundtable1.id, speakerId: speakers["Rey-Sheng Her"].id, role: "speaker" },
      { sessionId: roundtable1.id, speakerId: speakers["Pierce Salguero"].id, role: "speaker" },
      { sessionId: roundtable1.id, speakerId: speakers["Monica Sanford"].id, role: "speaker" },
      { sessionId: roundtable1.id, speakerId: speakers["Brooke Lavelle"].id, role: "speaker" },
    ],
  });

  // Dinner
  await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "dinner",
      titleZh: "晚宴",
      titleEn: "Dinner",
      venue: "Harvard Faculty Club",
      startTime: "19:00",
      sortOrder: 10,
    },
  });

  // ══════════════════════════════════════
  // Day 4 (May 8, Fri) — Cheng Yen's Philosophy
  // ══════════════════════════════════════

  // Keynote Speech II
  const keynote2 = await prisma.session.create({
    data: {
      dayId: day4.id,
      type: "keynote",
      titleZh: "寺院與瘋人院：近代及當代東亞佛教中精神病患的照護與收容",
      titleEn: "Monasteries & Madhouses: On the Care and Confinement of the Insane in Early Modern and Contemporary East Asian Buddhism",
      subtitleZh: "專題演講 II",
      subtitleEn: "Keynote Speech II",
      startTime: "08:30",
      duration: 30,
      sortOrder: 1,
    },
  });

  await prisma.sessionSpeaker.create({
    data: { sessionId: keynote2.id, speakerId: speakers["James Robson"].id, role: "speaker" },
  });

  // Session III
  const panel3 = await prisma.session.create({
    data: {
      dayId: day4.id,
      type: "paper_session",
      titleZh: "《法華經》與證嚴上人思想",
      titleEn: "The Lotus Sutra and the Thought of Master Cheng Yen",
      subtitleZh: "場次 III",
      subtitleEn: "Session III",
      startTime: "09:00",
      duration: 100,
      sortOrder: 2,
    },
  });

  await prisma.sessionSpeaker.create({
    data: { sessionId: panel3.id, speakerId: speakers["Parimal Patil"].id, role: "moderator" },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel3.id,
      speakerId: speakers["Rey-Sheng Her"].id,
      titleZh: "證嚴上人講述的《法華經》",
      titleEn: "The Lotus Sutra as Taught by Master Cheng Yen",
      status: "accepted",
      sortOrder: 1,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel3.id,
      speakerId: speakers["Chien-te Lin"].id,
      titleZh: "從人間佛教到證嚴法師的宗教觀",
      titleEn: "From Humanistic Buddhism to the Perspective of Religion of Dharma Master Cheng Yen",
      status: "accepted",
      sortOrder: 2,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel3.id,
      speakerId: speakers["Elise Anne DeVido"].id,
      titleZh: "慈濟教義中的動物報恩",
      titleEn: "Animal Repaying Debts of Gratitude in Tzu Chi Teachings",
      status: "accepted",
      sortOrder: 3,
    },
  });

  // Session III commentators
  await prisma.sessionSpeaker.createMany({
    data: [
      { sessionId: panel3.id, speakerId: speakers["Weijen Teng"].id, role: "discussant" },
      { sessionId: panel3.id, speakerId: speakers["Justin Ritzinger"].id, role: "discussant" },
    ],
  });

  // Break
  await prisma.session.create({
    data: {
      dayId: day4.id,
      type: "break",
      titleZh: "休息",
      titleEn: "Break",
      startTime: "10:40",
      duration: 20,
      sortOrder: 3,
    },
  });

  // Session IV
  const panel4 = await prisma.session.create({
    data: {
      dayId: day4.id,
      type: "paper_session",
      titleZh: "慈濟的魅力、實踐與宗教社群",
      titleEn: "Charisma, Practice, and Religious Community in Tzu Chi",
      subtitleZh: "場次 IV",
      subtitleEn: "Session IV",
      startTime: "11:00",
      duration: 100,
      sortOrder: 4,
    },
  });

  await prisma.sessionSpeaker.create({
    data: { sessionId: panel4.id, speakerId: speakers["Kate Crosby"].id, role: "moderator" },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel4.id,
      speakerId: speakers["Yu-chen Li"].id,
      titleZh: "書寫證嚴上人：以魅力型佛教尼師傳記出版宗教魅力",
      titleEn: "Writing Ven. Cheng Yen: to publishing religious charisma by the biographies of charismatic Buddhist nuns",
      status: "accepted",
      sortOrder: 1,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel4.id,
      speakerId: speakers["Pei-ying Lin"].id,
      titleZh: "慈悲網絡：全球化時代的慈濟清修士",
      titleEn: "Compassion Network: The Tzu Chi Pure Practitioners in the Age of Globalisation",
      status: "accepted",
      sortOrder: 2,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel4.id,
      speakerId: speakers["Julia Huang"].id,
      titleZh: "當代捨身菩薩：慈濟大體捐贈中的情感、情感實踐與倫理",
      titleEn: "Modern Body-Giving Bodhisattvas: Affect, Emotional Practice, and Ethics in the Whole-Body Donations to Tzu Chi",
      status: "accepted",
      sortOrder: 3,
    },
  });

  // Session IV commentators
  await prisma.sessionSpeaker.createMany({
    data: [
      { sessionId: panel4.id, speakerId: speakers["Pierce Salguero"].id, role: "discussant" },
      { sessionId: panel4.id, speakerId: speakers["Jonathan Gold"].id, role: "discussant" },
    ],
  });

  // Lunch
  await prisma.session.create({
    data: {
      dayId: day4.id,
      type: "break",
      titleZh: "午餐",
      titleEn: "Lunch",
      startTime: "12:40",
      duration: 80,
      sortOrder: 5,
    },
  });

  // Session V
  const panel5 = await prisma.session.create({
    data: {
      dayId: day4.id,
      type: "paper_session",
      titleZh: "全球人道主義與入世佛教",
      titleEn: "Global Humanitarianism and Engaged Buddhism",
      subtitleZh: "場次 V",
      subtitleEn: "Session V",
      startTime: "14:00",
      duration: 130,
      sortOrder: 6,
    },
  });

  await prisma.sessionSpeaker.create({
    data: { sessionId: panel5.id, speakerId: speakers["Weijen Teng"].id, role: "moderator" },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel5.id,
      speakerId: speakers["William Yau Nang Ng"].id,
      titleZh: "重新思考人類安全：慈濟式服務佛教",
      titleEn: "Reconsidering Human Security: Tzu Chi–Style Service Buddhism",
      status: "accepted",
      sortOrder: 1,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel5.id,
      speakerId: speakers["Weishan Huang"].id,
      titleZh: "慈悲設計：慈濟科技人道主義的道德生態",
      titleEn: "Compassion by Design: The Moral Ecology of Tzu Chi's Technological Humanitarianism",
      status: "accepted",
      sortOrder: 2,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel5.id,
      speakerId: speakers["Jiangang Zhu"].id,
      titleZh: "宗教與志工服務：以中國大陸慈濟志工為個案研究",
      titleEn: "Religion and Volunteerism: A case study on Tzu Chi volunteers in mainland China",
      status: "accepted",
      sortOrder: 3,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel5.id,
      speakerId: speakers["Yining Liu"].id,
      titleZh: "人類世中的生態菩薩",
      titleEn: "Eco-Bodhisattvas in the Anthropocene",
      status: "accepted",
      sortOrder: 4,
    },
  });

  // Session V commentators
  await prisma.sessionSpeaker.createMany({
    data: [
      { sessionId: panel5.id, speakerId: speakers["Monica Sanford"].id, role: "discussant" },
      { sessionId: panel5.id, speakerId: speakers["Megan Bryson"].id, role: "discussant" },
    ],
  });

  // Break
  await prisma.session.create({
    data: {
      dayId: day4.id,
      type: "break",
      titleZh: "休息",
      titleEn: "Break",
      startTime: "16:10",
      duration: 20,
      sortOrder: 7,
    },
  });

  // Roundtable II
  const roundtable2 = await prisma.session.create({
    data: {
      dayId: day4.id,
      type: "roundtable",
      titleZh: "圓桌論壇 II：佛教的未來",
      titleEn: "Roundtable II: The Future of Buddhism",
      startTime: "16:30",
      duration: 120,
      sortOrder: 8,
    },
  });

  await prisma.sessionSpeaker.createMany({
    data: [
      { sessionId: roundtable2.id, speakerId: speakers["Rey-Sheng Her"].id, role: "moderator" },
      { sessionId: roundtable2.id, speakerId: speakers["Jonathan Gold"].id, role: "speaker" },
      { sessionId: roundtable2.id, speakerId: speakers["William McGrath"].id, role: "speaker" },
      { sessionId: roundtable2.id, speakerId: speakers["Yinggang Sun"].id, role: "speaker" },
      { sessionId: roundtable2.id, speakerId: speakers["Weijen Teng"].id, role: "speaker" },
      { sessionId: roundtable2.id, speakerId: speakers["Julia Huang"].id, role: "speaker" },
      { sessionId: roundtable2.id, speakerId: speakers["Kate Crosby"].id, role: "speaker" },
    ],
  });

  // Dinner
  await prisma.session.create({
    data: {
      dayId: day4.id,
      type: "dinner",
      titleZh: "晚宴",
      titleEn: "Dinner",
      startTime: "19:00",
      sortOrder: 9,
    },
  });

  // ══════════════════════════════════════
  // Day 5 (May 9, Sat) — Design Futures
  // ══════════════════════════════════════

  // Keynote Speech III
  const keynote3 = await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "keynote",
      titleZh: "專題演講 III",
      titleEn: "Keynote Speech III",
      subtitleZh: "專題演講 III",
      subtitleEn: "Keynote Speech III",
      startTime: "09:00",
      duration: 20,
      sortOrder: 1,
    },
  });

  await prisma.sessionSpeaker.create({
    data: { sessionId: keynote3.id, speakerId: speakers["Eugene Wang"].id, role: "speaker" },
  });

  // Session VI
  const panel6 = await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "paper_session",
      titleZh: "佛教世界建構作為概念框架",
      titleEn: "Buddhist Worldmaking as Conceptual Framework",
      subtitleZh: "場次 VI",
      subtitleEn: "Session VI",
      startTime: "09:20",
      duration: 75,
      sortOrder: 2,
    },
  });

  await prisma.sessionSpeaker.create({
    data: { sessionId: panel6.id, speakerId: speakers["Eugene Wang"].id, role: "moderator" },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel6.id,
      speakerId: speakers["Melissa McCormick"].id,
      titleZh: "TBD",
      titleEn: "TBD",
      status: "draft",
      sortOrder: 1,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel6.id,
      speakerId: speakers["Sonya Lee"].id,
      titleZh: "回收再利用的精神：通過複製保存佛教壁畫",
      titleEn: "In the Spirit of Recycle and Reuse: Preserving Buddhist Wall Painting through Replication",
      status: "accepted",
      sortOrder: 2,
    },
  });

  // Break
  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "break",
      titleZh: "休息",
      titleEn: "Break",
      startTime: "10:35",
      duration: 15,
      sortOrder: 3,
    },
  });

  // Session VII
  const panel7 = await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "paper_session",
      titleZh: "推測性設計與替代未來",
      titleEn: "Speculative Design and Alternative Futures",
      subtitleZh: "場次 VII",
      subtitleEn: "Session VII",
      startTime: "10:50",
      duration: 90,
      sortOrder: 4,
    },
  });

  await prisma.sessionSpeaker.create({
    data: { sessionId: panel7.id, speakerId: speakers["Anthony Dunne"].id, role: "moderator" },
  });

  await prisma.sessionSpeaker.createMany({
    data: [
      { sessionId: panel7.id, speakerId: speakers["Fiona Raby"].id, role: "speaker" },
      { sessionId: panel7.id, speakerId: speakers["James Auger"].id, role: "speaker" },
      { sessionId: panel7.id, speakerId: speakers["Allen Sayegh"].id, role: "speaker" },
    ],
  });

  // Lunch
  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "break",
      titleZh: "午餐",
      titleEn: "Lunch",
      startTime: "12:20",
      duration: 60,
      sortOrder: 5,
    },
  });

  // Session VIII
  const panel8 = await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "paper_session",
      titleZh: "建築、生態與系統思維",
      titleEn: "Architecture, Ecology, and Systems Thinking",
      subtitleZh: "場次 VIII",
      subtitleEn: "Session VIII",
      startTime: "13:20",
      duration: 75,
      sortOrder: 6,
    },
  });

  await prisma.sessionSpeaker.create({
    data: { sessionId: panel8.id, speakerId: speakers["Sheila Kennedy"].id, role: "moderator" },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel8.id,
      speakerId: speakers["Jungyoon Kim"].id,
      titleZh: "TBD",
      titleEn: "TBD",
      status: "draft",
      sortOrder: 1,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel8.id,
      speakerId: speakers["Goh Yu Han"].id,
      titleZh: "TBD",
      titleEn: "TBD",
      status: "draft",
      sortOrder: 2,
    },
  });

  // Chang Huai Yan as co-presenter on the SALAD Dressing paper
  await prisma.sessionSpeaker.create({
    data: { sessionId: panel8.id, speakerId: speakers["Chang Huai Yan"].id, role: "speaker" },
  });

  // Break
  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "break",
      titleZh: "休息",
      titleEn: "Break",
      startTime: "14:35",
      duration: 15,
      sortOrder: 7,
    },
  });

  // Session IX
  const panel9 = await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "paper_session",
      titleZh: "心靈、中介與多感官體驗",
      titleEn: "Mind, Mediation, and Multisensorial Experience",
      subtitleZh: "場次 IX",
      subtitleEn: "Session IX",
      startTime: "14:50",
      duration: 75,
      sortOrder: 8,
    },
  });

  await prisma.sessionSpeaker.create({
    data: { sessionId: panel9.id, speakerId: speakers["Monique Mead"].id, role: "moderator" },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel9.id,
      speakerId: speakers["Cuilian Liu"].id,
      titleZh: "TBD",
      titleEn: "TBD",
      status: "draft",
      sortOrder: 1,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel9.id,
      speakerId: speakers["Chenchen Lu"].id,
      titleZh: "TBD",
      titleEn: "TBD",
      status: "draft",
      sortOrder: 2,
    },
  });

  // Break
  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "break",
      titleZh: "休息",
      titleEn: "Break",
      startTime: "16:05",
      duration: 15,
      sortOrder: 9,
    },
  });

  // Final Roundtable
  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "roundtable",
      titleZh: "「佛教之後的設計」意味著什麼？",
      titleEn: "What Does It Mean to Design 'After Buddhism'?",
      subtitleZh: "最終圓桌論壇",
      subtitleEn: "Final Roundtable",
      startTime: "16:20",
      duration: 40,
      sortOrder: 10,
    },
  });

  // Closing
  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "closing",
      titleZh: "閉幕",
      titleEn: "Closing",
      startTime: "17:00",
      duration: 10,
      sortOrder: 11,
    },
  });

  // Dinner
  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "dinner",
      titleZh: "晚宴",
      titleEn: "Dinner",
      startTime: "17:15",
      duration: 75,
      sortOrder: 12,
    },
  });

  // Concert
  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "exhibition",
      titleZh: "音樂會：同一片天空下",
      titleEn: "Concert: Under One Sky",
      venue: "Main Hall at Harvard Art Museum",
      startTime: "19:00",
      duration: 120,
      sortOrder: 13,
    },
  });

  // ── Venues ──
  await prisma.venue.createMany({
    data: [
      {
        siteId: site.id,
        name: "Student Organization Center at Hilles (SOCH)",
        nameZh: "哈佛大學學生社團中心",
        description: "學術發表、論壇及交流活動之主場地。",
        descriptionEn: "Main venue for academic presentations, forums, and networking events.",
        address: "59 Shepard St, Cambridge, MA 02138",
        type: "main",
        image: "/img/soch.webp",
      },
      {
        siteId: site.id,
        name: "Harvard CAMLab Cave",
        nameZh: "哈佛 CAMLab 洞窟",
        description: "「明心」沉浸式展覽場地。",
        descriptionEn: "Venue for the \"Journey to Enlightenment\" immersive exhibition.",
        address: "Adolphus Busch Hall, 29 Kirkland St, Cambridge, MA 02138",
        type: "exhibition",
      },
      {
        siteId: site.id,
        name: "Harvard Adolphus Busch Hall",
        nameZh: "哈佛 Adolphus Busch Hall",
        description: "明心展覽開幕典禮場地。",
        descriptionEn: "Venue for the Journey to Enlightenment exhibition opening ceremony.",
        address: "29 Kirkland St, Cambridge, MA 02138",
        type: "exhibition",
        image: "/img/hall.jpg",
      },
    ],
  });

  // ── Exhibition ──
  await prisma.exhibition.create({
    data: {
      siteId: site.id,
      titleZh: "明心",
      titleEn: "Journey to Enlightenment",
      description:
        "由哈佛大學CAMLab策劃，結合沉浸式藝術體驗，引領觀者走入佛教藝術與靜思法脈的精神之旅。",
      startDate: new Date("2026-05-05"),
      endDate: new Date("2026-05-09"),
      venue: "Harvard CAMLab Cave",
    },
  });

  // ── Site Settings (description) ──
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

  for (const s of descSettings) {
    await prisma.siteSetting.create({
      data: { siteId: site.id, key: s.key, value: s.value },
    });
  }

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
