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
      domain: "symposium.tzuchi.org",
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
    { name: "何日生", nameEn: "Rey-Sheng Her", affiliation: "慈濟基金會", title: "Deputy CEO", sortOrder: 1 },
    { name: "Stephen Teiser", nameEn: "Stephen Teiser", affiliation: "Princeton University", title: "Professor", sortOrder: 2 },
    { name: "邵嘉德", nameEn: "Jiade Shao", affiliation: null, title: null, sortOrder: 3 },
    { name: "林安梧", nameEn: "Amwu Lin", affiliation: null, title: null, sortOrder: 4 },
    { name: "Jonathan Gold", nameEn: "Jonathan Gold", affiliation: null, title: null, sortOrder: 5 },
    { name: "Pierce Salguero", nameEn: "Pierce Salguero", affiliation: null, title: null, sortOrder: 6 },
    { name: "Mayfair Yang", nameEn: "Mayfair Yang", affiliation: null, title: null, sortOrder: 7 },
    { name: "James Robson", nameEn: "James Robson", affiliation: null, title: null, sortOrder: 8 },
    { name: "Brooke Lavelle", nameEn: "Brooke Lavelle", affiliation: null, title: null, sortOrder: 9 },
    { name: "林建德", nameEn: "Chien-te Lin", affiliation: "慈濟大學", title: "宗教與人文研究所教授", sortOrder: 10 },
    { name: "鄧偉仁", nameEn: "Weijen Teng", affiliation: null, title: null, sortOrder: 11 },
    { name: "Justin Ritzinger", nameEn: "Justin Ritzinger", affiliation: null, title: null, sortOrder: 12 },
    { name: "Kate Crosby", nameEn: "Kate Crosby", affiliation: null, title: null, sortOrder: 13 },
    { name: "李玉珍", nameEn: "Yu-chen Li", affiliation: null, title: null, sortOrder: 14 },
    { name: "林佩瑩", nameEn: "Pei-ying Lin", affiliation: null, title: null, sortOrder: 15 },
    { name: "黃倩玉", nameEn: "Julia Huang", affiliation: null, title: null, sortOrder: 16 },
    { name: "William McGrath", nameEn: "William McGrath", affiliation: null, title: null, sortOrder: 17 },
    { name: "孫英剛", nameEn: "Yinggang Sun", affiliation: null, title: null, sortOrder: 18 },
  ];

  const speakers: Record<string, { id: number }> = {};
  for (const s of speakerData) {
    const created = await prisma.speaker.create({
      data: {
        siteId: site.id,
        name: s.name,
        nameEn: s.nameEn,
        affiliation: s.affiliation,
        title: s.title,
        status: "confirmed",
        sortOrder: s.sortOrder,
      },
    });
    speakers[s.nameEn!] = created;
  }

  // ── Create days ──
  const day1 = await prisma.day.create({
    data: {
      siteId: site.id,
      dayNumber: 1,
      date: new Date("2026-05-05"),
      titleZh: "明心展覽導覽",
      titleEn: "\"Journey to Enlightenment\" Exhibition Tour",
    },
  });

  const day2 = await prisma.day.create({
    data: {
      siteId: site.id,
      dayNumber: 2,
      date: new Date("2026-05-06"),
      titleZh: "明心展覽開幕",
      titleEn: "Opening Ceremony of \"Journey to Enlightenment\"",
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
  // Day 1 (May 5, Tue) — Exhibition Tour
  // ══════════════════════════════════════
  await prisma.session.create({
    data: {
      dayId: day1.id,
      type: "exhibition",
      titleZh: "明心展覽導覽",
      titleEn: "\"Journey to Enlightenment\" Exhibition Tour",
      subtitleZh: "邀請學者與貴賓參觀「明心」展覽",
      subtitleEn: "Inviting scholars and guests to visit the \"Journey to Enlightenment\" exhibition",
      startTime: "13:30",
      duration: 210,
      venue: "Harvard CAMLab Cave",
      sortOrder: 1,
    },
  });

  // ══════════════════════════════════════
  // Day 2 (May 6, Wed) — Exhibition Opening
  // ══════════════════════════════════════
  await prisma.session.create({
    data: {
      dayId: day2.id,
      type: "opening",
      titleZh: "明心展覽開幕典禮",
      titleEn: "Opening Ceremony of \"Journey to Enlightenment\"",
      startTime: "18:30",
      duration: 60,
      venue: "Harvard Adolphus Busch Hall",
      sortOrder: 1,
    },
  });

  // ══════════════════════════════════════
  // Day 3 (May 7, Thu) — Applied Buddhism
  // ══════════════════════════════════════
  await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "registration",
      titleZh: "報到",
      titleEn: "Registration",
      startTime: "08:30",
      duration: 50,
      sortOrder: 1,
    },
  });

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

  const panel1 = await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "paper_session",
      titleZh: "菩薩道的哲學與倫理基礎",
      titleEn: "Philosophical and Ethical Foundations of the Bodhisattva Path",
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

  const panel2 = await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "paper_session",
      titleZh: "佛教、健康與照護倫理",
      titleEn: "Buddhism, Health, and Ethics of Care",
      startTime: "14:00",
      duration: 130,
      sortOrder: 7,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel2.id,
      speakerId: speakers["Jonathan Gold"].id,
      titleZh: "從佛陀的醫師到藥師佛",
      titleEn: "From the Buddha's Physician to the Medicine Buddha",
      status: "accepted",
      sortOrder: 1,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel2.id,
      speakerId: speakers["Pierce Salguero"].id,
      titleZh: "超越正念：美國的佛教與健康",
      titleEn: "Beyond Mindfulness: Buddhism & Health in the US",
      status: "accepted",
      sortOrder: 2,
    },
  });

  await prisma.paper.create({
    data: {
      sessionId: panel2.id,
      speakerId: speakers["Mayfair Yang"].id,
      titleZh: "追逐赤頸鶴：藍毗尼的佛教與印度教多物種群落",
      titleEn: "Chasing the Sarus Cranes: Buddhist and Hindu Multispecies Assemblages in Lumbini",
      status: "accepted",
      sortOrder: 3,
    },
  });

  await prisma.sessionSpeaker.createMany({
    data: [
      { sessionId: panel2.id, speakerId: speakers["James Robson"].id, role: "discussant" },
      { sessionId: panel2.id, speakerId: speakers["Brooke Lavelle"].id, role: "discussant" },
    ],
  });

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

  await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "roundtable",
      titleZh: "圓桌論壇",
      titleEn: "Roundtable",
      startTime: "16:30",
      duration: 90,
      sortOrder: 9,
    },
  });

  await prisma.session.create({
    data: {
      dayId: day3.id,
      type: "dinner",
      titleZh: "晚宴",
      titleEn: "Dinner",
      startTime: "19:00",
      sortOrder: 10,
    },
  });

  // ══════════════════════════════════════
  // Day 4 (May 8, Fri) — Cheng Yen's Philosophy
  // ══════════════════════════════════════
  await prisma.session.create({
    data: {
      dayId: day4.id,
      type: "registration",
      titleZh: "報到",
      titleEn: "Registration",
      startTime: "08:30",
      duration: 30,
      sortOrder: 1,
    },
  });

  const panel3 = await prisma.session.create({
    data: {
      dayId: day4.id,
      type: "paper_session",
      titleZh: "證嚴上人思想與領導力（上）",
      titleEn: "Venerable Cheng Yen's Philosophy and Leadership (Part I)",
      startTime: "09:00",
      duration: 100,
      sortOrder: 2,
    },
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

  await prisma.sessionSpeaker.createMany({
    data: [
      { sessionId: panel3.id, speakerId: speakers["Weijen Teng"].id, role: "discussant" },
      { sessionId: panel3.id, speakerId: speakers["Justin Ritzinger"].id, role: "discussant" },
    ],
  });

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

  const panel4 = await prisma.session.create({
    data: {
      dayId: day4.id,
      type: "paper_session",
      titleZh: "證嚴上人思想與領導力（下）",
      titleEn: "Venerable Cheng Yen's Philosophy and Leadership (Part II)",
      startTime: "11:00",
      duration: 100,
      sortOrder: 4,
    },
  });

  await prisma.sessionSpeaker.create({
    data: { sessionId: panel4.id, speakerId: speakers["Kate Crosby"].id, role: "speaker" },
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

  await prisma.session.create({
    data: {
      dayId: day4.id,
      type: "paper_session",
      titleZh: "論文發表",
      titleEn: "Paper Session",
      startTime: "14:00",
      duration: 130,
      sortOrder: 6,
    },
  });

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
  // Day 5 (May 9, Sat) — Design Futures (TBD)
  // ══════════════════════════════════════
  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "registration",
      titleZh: "報到",
      titleEn: "Registration",
      startTime: "09:00",
      duration: 20,
      sortOrder: 1,
    },
  });

  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "paper_session",
      titleZh: "場次一",
      titleEn: "Session I",
      startTime: "09:20",
      duration: 75,
      sortOrder: 2,
    },
  });

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

  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "paper_session",
      titleZh: "場次二",
      titleEn: "Session II",
      startTime: "10:50",
      duration: 90,
      sortOrder: 4,
    },
  });

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

  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "paper_session",
      titleZh: "場次三",
      titleEn: "Session III",
      startTime: "13:20",
      duration: 75,
      sortOrder: 6,
    },
  });

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

  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "paper_session",
      titleZh: "場次四",
      titleEn: "Session IV",
      startTime: "14:50",
      duration: 75,
      sortOrder: 8,
    },
  });

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

  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "paper_session",
      titleZh: "綜合討論",
      titleEn: "General Discussion",
      startTime: "16:20",
      duration: 40,
      sortOrder: 10,
    },
  });

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

  await prisma.session.create({
    data: {
      dayId: day5.id,
      type: "exhibition",
      titleZh: "展覽活動",
      titleEn: "Exhibition Event",
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
        type: "main",
        image: "/img/soch.webp",
      },
      {
        siteId: site.id,
        name: "Harvard CAMLab Cave",
        nameZh: "哈佛 CAMLab 洞窟",
        description: "「明心」沉浸式展覽場地。",
        type: "exhibition",
      },
      {
        siteId: site.id,
        name: "Harvard Adolphus Busch Hall",
        nameZh: "哈佛 Adolphus Busch Hall",
        description: "明心展覽開幕典禮場地。",
        type: "exhibition",
        image: "/img/hall.jpg",
      },
      {
        siteId: site.id,
        name: "Harvard Faculty Club",
        nameZh: "哈佛教職員俱樂部",
        type: "evening",
        image: "/img/music.webp",
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
