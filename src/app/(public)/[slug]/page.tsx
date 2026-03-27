"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  Eye,
  Clock,
  CalendarDays,
  BookOpen,
  Lightbulb,
  Heart,
  Globe,
} from "lucide-react";

/* ─── Scroll Animation Hook ─── */
function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
import SpeakerModal from "@/components/public/SpeakerModal";

/* ─── Data ─── */

const infoCards = [
  { icon: Calendar, title: "2026年5月5日─9日", sub: "五天學術交流與展覽" },
  { icon: MapPin, title: "哈佛大學", sub: "Student Organization Center at Hilles (SOCH)" },
  { icon: Users, title: "主辦單位", sub: "慈濟基金會 · Harvard CAMLab" },
];

/* ─── 活動簡介 ─── */

const descriptionData = {
  headline: "一場探索佛教未來的學術盛會",
  body: "「全球共善學思會」匯聚國際佛學研究者、宗教實踐者與人文學者，以三日的學術發表、圓桌論壇與沉浸式藝術體驗，深入探討應用佛教、菩薩道精神與佛教藝術的當代轉譯。本次學思會由慈濟基金會與哈佛大學 CAMLab 共同主辦，期盼在學術對話中，為佛教的未來開展新的視野與可能。",
  highlights: [
    { icon: BookOpen, label: "多篇學術論文發表" },
    { icon: Lightbulb, label: "2 場圓桌論壇對話" },
    { icon: Heart, label: "跨宗派跨領域交流" },
    { icon: Globe, label: "來自全球的學者參與" },
  ],
};

/* ─── 議程 ─── */

type PaperItem = { title: string; author: string; affiliation: string };
type SpeakerItem = { name: string; role?: string };
type SessionItem = {
  time: string;
  duration?: string;
  type: string;
  badge: "gold" | "green" | "muted";
  title?: string;
  speakers?: SpeakerItem[];
  papers?: PaperItem[];
  discussants?: string[];
  venue?: string;
  capacity?: number;
  highlight?: boolean;
};

const dayTabs = [
  { label: "5/5 (二)", date: "5.5", weekday: "星期二", theme: "明心展覽導覽" },
  { label: "5/6 (三)", date: "5.6", weekday: "星期三", theme: "明心展覽開幕" },
  { label: "5/7 (四)", date: "5.7", weekday: "星期四", theme: "應用佛教與菩薩道" },
  { label: "5/8 (五)", date: "5.8", weekday: "星期五", theme: "證嚴上人思想與領導力" },
  { label: "5/9 (六)", date: "5.9", weekday: "星期六", theme: "佛教之後的設計未來" },
];

const daySessions: SessionItem[][] = [
  // Day 1 — May 5 (Tue) Exhibition Tour
  [
    { time: "1:30", duration: "下午 · 210 分鐘", type: "展覽導覽", badge: "gold", title: "明心展覽導覽", venue: "Harvard CAMLab Cave" },
  ],
  // Day 2 — May 6 (Wed) Exhibition Opening
  [
    { time: "6:30", duration: "晚間 · 60 分鐘", type: "開幕典禮", badge: "gold", title: "明心展覽開幕典禮", venue: "Harvard Adolphus Busch Hall" },
  ],
  // Day 3 — May 7 (Thu) Applied Buddhism
  [
    { time: "8:30", duration: "上午 · 50 分鐘", type: "報到", badge: "muted" },
    { time: "9:20", duration: "上午 · 10 分鐘", type: "大合照", badge: "muted" },
    { time: "9:30", duration: "上午 · 30 分鐘", type: "專題演講 I", badge: "gold", title: "Contemporary Interpretations of Buddhism: The Significance of Applied Buddhism", speakers: [{ name: "Rey-Sheng Her (何日生)" }], highlight: true },
    { time: "10:20", duration: "上午 · 130 分鐘", type: "論文發表", badge: "green", title: "Philosophical and Ethical Foundations of the Bodhisattva Path", speakers: [{ name: "Stephen Teiser", role: "Moderator" }], papers: [{ title: "The Theoretical Implication and Contemporary Significance of the Buddhist Concept of Equality", author: "Jiade Shao", affiliation: "" }, { title: "Integrating Non-Arising and Vitality: Tzu Chi's Practical Interpretation of Infinite Meanings Sutra", author: "Amwu Lin", affiliation: "" }, { title: "Venerable Cheng Yen's Exegesis of the Lotus Sutra and the Formation of Tzu Chi Buddhism", author: "", affiliation: "" }, { title: "Upāya Without Closure: Coercion, Trauma, and the Contemporary Bodhisattva Path", author: "Jonathan Gold", affiliation: "" }] },
    { time: "2:00", duration: "下午 · 130 分鐘", type: "論文發表", badge: "green", title: "Buddhism, Health, and Ethics of Care", papers: [{ title: "From the Buddha's Physician to the Medicine Buddha", author: "Jonathan Gold", affiliation: "" }, { title: "Beyond Mindfulness: Buddhism & Health in the US", author: "Pierce Salguero", affiliation: "" }, { title: "Chasing the Sarus Cranes: Buddhist and Hindu Multispecies Assemblages in Lumbini", author: "Mayfair Yang", affiliation: "" }], discussants: ["James Robson", "Brooke Lavelle"] },
    { time: "4:30", duration: "下午 · 90 分鐘", type: "圓桌論壇", badge: "gold" },
    { time: "7:00", duration: "晚間", type: "晚宴", badge: "muted" },
  ],
  // Day 4 — May 8 (Fri) Cheng Yen's Philosophy
  [
    { time: "8:30", duration: "上午 · 30 分鐘", type: "報到", badge: "muted" },
    { time: "9:00", duration: "上午 · 100 分鐘", type: "論文發表", badge: "green", title: "Venerable Cheng Yen's Philosophy and Leadership (I)", papers: [{ title: "The Lotus Sutra as Taught by Master Cheng Yen", author: "Rey-Sheng Her", affiliation: "" }, { title: "From Humanistic Buddhism to the Perspective of Religion of Dharma Master Cheng Yen", author: "Chien-te Lin", affiliation: "" }], discussants: ["Weijen Teng", "Justin Ritzinger"] },
    { time: "11:00", duration: "上午 · 100 分鐘", type: "論文發表", badge: "green", title: "Venerable Cheng Yen's Philosophy and Leadership (II)", speakers: [{ name: "Kate Crosby" }], papers: [{ title: "Writing Ven. Cheng Yen: to publishing religious charisma by the biographies of charismatic Buddhist nuns", author: "Yu-chen Li", affiliation: "" }, { title: "Compassion Network: The Tzu Chi Pure Practitioners in the Age of Globalisation", author: "Pei-ying Lin", affiliation: "" }, { title: "Modern Body-Giving Bodhisattvas: Affect, Emotional Practice, and Ethics in the Whole-Body Donations to Tzu Chi", author: "Julia Huang", affiliation: "" }] },
    { time: "2:00", duration: "下午 · 130 分鐘", type: "論文發表", badge: "green" },
    { time: "4:30", duration: "下午 · 120 分鐘", type: "圓桌論壇 II", badge: "gold", title: "The Future of Buddhism", speakers: [{ name: "Rey-Sheng Her", role: "Moderator" }, { name: "Jonathan Gold" }, { name: "William McGrath" }, { name: "Yinggang Sun" }, { name: "Weijen Teng" }, { name: "Julia Huang" }, { name: "Kate Crosby" }] },
    { time: "7:00", duration: "晚間", type: "晚宴", badge: "muted" },
  ],
  // Day 5 — May 9 (Sat) Design Futures (details TBD)
  [
    { time: "9:00", duration: "上午 · 20 分鐘", type: "報到", badge: "muted" },
    { time: "9:20", duration: "上午 · 75 分鐘", type: "場次一", badge: "green" },
    { time: "10:50", duration: "上午 · 90 分鐘", type: "場次二", badge: "green" },
    { time: "1:20", duration: "下午 · 75 分鐘", type: "場次三", badge: "green" },
    { time: "2:50", duration: "下午 · 75 分鐘", type: "場次四", badge: "green" },
    { time: "4:20", duration: "下午 · 40 分鐘", type: "綜合討論", badge: "gold" },
    { time: "5:00", duration: "下午 · 10 分鐘", type: "閉幕", badge: "gold" },
    { time: "7:00", duration: "晚間", type: "展覽活動", badge: "muted" },
  ],
];

const stats = [
  { number: "5", label: "天學術交流" },
  { number: "6", label: "場論文發表" },
  { number: "2", label: "場圓桌論壇" },
  { number: "1", label: "沉浸式展覽" },
];

const speakers = [
  {
    name: "何日生 Rey-Sheng Her",
    affiliation: "慈濟基金會",
    title: "Deputy CEO",
    topicZh: "Contemporary Interpretations of Buddhism: The Significance of Applied Buddhism",
    tags: ["5/7 · 專題演講 I", "5/8 · 圓桌論壇 II"],
  },
  {
    name: "Stephen Teiser",
    affiliation: "Princeton University",
    title: "Professor",
    tags: ["5/7 · Moderator"],
  },
  {
    name: "Jiade Shao (邵嘉德)",
    affiliation: "",
    title: "",
    topicZh: "The Theoretical Implication and Contemporary Significance of the Buddhist Concept of Equality",
    tags: ["5/7 · 論文發表"],
  },
  {
    name: "Amwu Lin (林安梧)",
    affiliation: "",
    title: "",
    topicZh: "Integrating Non-Arising and Vitality: Tzu Chi's Practical Interpretation of Infinite Meanings Sutra",
    tags: ["5/7 · 論文發表"],
  },
  {
    name: "Jonathan Gold",
    affiliation: "",
    title: "",
    topicZh: "Upāya Without Closure: Coercion, Trauma, and the Contemporary Bodhisattva Path",
    papers: ["From the Buddha's Physician to the Medicine Buddha"],
    tags: ["5/7 · 論文發表", "5/8 · 圓桌論壇 II"],
  },
  {
    name: "Pierce Salguero",
    affiliation: "",
    title: "",
    topicZh: "Beyond Mindfulness: Buddhism & Health in the US",
    tags: ["5/7 · 論文發表"],
  },
  {
    name: "Mayfair Yang",
    affiliation: "",
    title: "",
    topicZh: "Chasing the Sarus Cranes: Buddhist and Hindu Multispecies Assemblages in Lumbini",
    tags: ["5/7 · 論文發表"],
  },
  {
    name: "James Robson",
    affiliation: "",
    title: "",
    tags: ["5/7 · Commentator"],
  },
  {
    name: "Brooke Lavelle",
    affiliation: "",
    title: "",
    tags: ["5/7 · Commentator"],
  },
  {
    name: "林建德 Chien-te Lin",
    affiliation: "慈濟大學",
    title: "宗教與人文研究所教授",
    topicZh: "From Humanistic Buddhism to the Perspective of Religion of Dharma Master Cheng Yen",
    tags: ["5/8 · 論文發表"],
  },
  {
    name: "Kate Crosby",
    affiliation: "",
    title: "",
    tags: ["5/8 · 論文發表", "5/8 · 圓桌論壇 II"],
  },
  {
    name: "Yu-chen Li (李玉珍)",
    affiliation: "",
    title: "",
    topicZh: "Writing Ven. Cheng Yen: to publishing religious charisma by the biographies of charismatic Buddhist nuns",
    tags: ["5/8 · 論文發表"],
  },
  {
    name: "Pei-ying Lin (林佩瑩)",
    affiliation: "",
    title: "",
    topicZh: "Compassion Network: The Tzu Chi Pure Practitioners in the Age of Globalisation",
    tags: ["5/8 · 論文發表"],
  },
  {
    name: "Julia Huang (黃倩玉)",
    affiliation: "",
    title: "",
    topicZh: "Modern Body-Giving Bodhisattvas: Affect, Emotional Practice, and Ethics in the Whole-Body Donations to Tzu Chi",
    tags: ["5/8 · 論文發表", "5/8 · 圓桌論壇 II"],
  },
  {
    name: "Weijen Teng (鄧偉仁)",
    affiliation: "",
    title: "",
    tags: ["5/8 · Commentator", "5/8 · 圓桌論壇 II"],
  },
  {
    name: "Justin Ritzinger",
    affiliation: "",
    title: "",
    tags: ["5/8 · Commentator"],
  },
  {
    name: "William McGrath",
    affiliation: "",
    title: "",
    tags: ["5/8 · 圓桌論壇 II"],
  },
  {
    name: "Yinggang Sun (孫英剛)",
    affiliation: "",
    title: "",
    tags: ["5/8 · 圓桌論壇 II"],
  },
];

/* ─── Page ─── */

export default function HomePage() {
  const [selectedSpeaker, setSelectedSpeaker] = useState<(typeof speakers)[number] | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const currentDay = dayTabs[activeDay];
  const currentSessions = daySessions[activeDay];

  return (
    <>
      {/* ═══ Hero Banner ═══ */}
      <section id="about" className="w-full">
        <img
          src="/img/about-banner.jpg"
          alt="Applied Buddhism and Contemporary Bodhisattva Path: Exploring the Future of Buddhism — May 7-9, 2026 at Student Organization Center at Hilles"
          className="w-full h-auto block"
        />
      </section>

      {/* ═══ 活動簡介 — Paper Design ═══ */}
      <section className="bg-white py-24 px-6 md:px-20" id="description">
        <div className="mx-auto max-w-6xl">
          {/* Header + Content side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Left: Paper-style header */}
            <div className="lg:col-span-4">
              <p className="font-inter text-gold text-[16px] font-semibold tracking-[0.2em] uppercase mb-4">
                關於
              </p>
              <h2 className="font-serif text-dark text-[72px] md:text-[88px] lg:text-[100px] font-bold leading-[1.1] tracking-[-0.02em]">
                活動
                <br />
                簡介
              </h2>
              <div className="w-12 h-[2px] bg-gold mt-6" />
            </div>

            {/* Right: Headline + Body */}
            <div className="lg:col-span-8 lg:pt-8">
              <h3 className="font-serif text-dark text-2xl md:text-3xl font-bold leading-tight mb-6">
                {descriptionData.headline}
              </h3>
              <p className="font-sans text-muted text-[15px] leading-[1.8]">
                {descriptionData.body}
              </p>
            </div>
          </div>

          {/* Highlights — 4 across */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-16">
            {descriptionData.highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-4 border border-border rounded-xl p-5 bg-white/60"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <p className="font-serif text-dark text-[16px] font-semibold">{item.label}</p>
                </div>
              );
            })}
          </div>

          {/* Gold Divider */}
          <div className="flex items-center justify-center py-10">
            <div className="h-px w-24 bg-gold/40" />
            <div className="w-2.5 h-2.5 rotate-45 border border-gold/40 mx-4" />
            <div className="h-px w-24 bg-gold/40" />
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {infoCards.map((card) => (
              <div
                key={card.title}
                className="border border-border rounded-xl p-8 text-center bg-white/60"
              >
                <card.icon className="w-6 h-6 text-gold mx-auto mb-4" />
                <p className="font-serif text-dark text-lg font-semibold mb-1">
                  {card.title}
                </p>
                <p className="font-inter text-muted text-[16px]">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 明心展覽 — Cinematic ═══ */}
      <section className="relative bg-[#0F0E0C] overflow-hidden" id="exhibition">
        {/* Hero area */}
        <div className="relative flex flex-col items-center justify-center w-full pt-[72px] px-6 md:px-20 pb-10 gap-5">
          {/* Background watermark */}
          <div className="absolute top-5 left-1/2 text-[180px] md:text-[280px] tracking-widest leading-[280px] text-[#9B7B2F]/[0.04] font-serif font-black pointer-events-none select-none">
            明心
          </div>

          <p className="font-inter text-[#D4B85A] text-[16px] font-semibold tracking-[0.25em] uppercase leading-4">
            特別展覽
          </p>
          <h2 className="font-serif text-[#FAF8F5] text-[64px] md:text-[96px] font-black tracking-[0.08em] leading-[1.15]">
            明心
          </h2>
          <p className="font-inter text-[#D4B85A]/80 text-[16px] tracking-[0.3em] uppercase font-light leading-5">
            Journey to Enlightenment
          </p>
          {/* Gold divider with dot */}
          <div className="flex items-center mt-2 gap-5">
            <div className="w-[60px] h-px bg-[#D4B85A]/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4B85A]" />
            <div className="w-[60px] h-px bg-[#D4B85A]/30" />
          </div>
        </div>

        {/* Info columns */}
        <div className="flex flex-col md:flex-row items-start w-full px-6 md:px-20">
          <div className="flex flex-col items-center grow shrink basis-0 py-8 px-6 gap-2 border-b md:border-b-0 md:border-r border-[#D4B85A]/15">
            <span className="font-sans text-[#D4B85A] text-[16px] tracking-widest font-medium leading-4">日期</span>
            <span className="font-serif text-[#FAF8F5] text-[20px] font-semibold leading-6">五月六日</span>
            <span className="font-sans text-[#FAF8F5]/50 text-[16px] font-light leading-[18px]">星期三</span>
          </div>
          <div className="flex flex-col items-center grow shrink basis-0 py-8 px-6 gap-2 border-b md:border-b-0 md:border-r border-[#D4B85A]/15">
            <span className="font-sans text-[#D4B85A] text-[16px] tracking-widest font-medium leading-4">預展覽時間</span>
            <span className="font-inter text-[#FAF8F5] text-[20px] font-medium tracking-[0.02em] leading-6">2:30 PM ~ 5:30 PM</span>
            <span className="font-sans text-[#FAF8F5]/50 text-[16px] font-light leading-[18px]">預展覽</span>
          </div>
          <div className="flex flex-col items-center grow shrink basis-0 py-8 px-6 gap-2">
            <span className="font-sans text-[#D4B85A] text-[16px] tracking-widest font-medium leading-4">地點</span>
            <span className="font-sans text-[#FAF8F5] text-[20px] font-medium leading-6">CAMLab</span>
            <span className="font-sans text-[#FAF8F5]/50 text-[16px] font-light leading-[18px]">展覽 + 創意工作空間</span>
          </div>
        </div>

        {/* Bottom note — badge style */}
        <div className="flex flex-col items-center w-full pt-7 pb-12 gap-3 px-6 md:px-20">
          <span className="font-sans text-[#D4B85A] text-[12px] font-medium tracking-[0.15em] leading-4">
            參觀梯次
          </span>
          <div className="flex items-center gap-3">
            <span className="bg-[#D4B85A] rounded-md py-2 px-4 flex items-center justify-center">
              <span className="font-sans text-[#1A1816] text-[13px] font-semibold leading-none">
                貴賓 ｜最多 2 梯次
              </span>
            </span>
            <span className="border-[1.5px] border-[#D4B85A]/40 bg-[#D4B85A]/10 rounded-md py-2 px-4 flex items-center justify-center">
              <span className="font-sans text-[#D4B85A] text-[13px] font-medium leading-none">
                志工 ｜1 梯次
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* ═══ 議程 ═══ */}
      <section className="bg-white py-20 px-20" id="programme">
        <div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <p className="font-inter text-gold text-[15px] tracking-[0.2em] uppercase mb-3">
                議程
              </p>
              <h2 className="font-serif text-dark text-4xl md:text-5xl lg:text-6xl font-bold">
                三日議程
              </h2>
            </div>
            <DayTabsOriginal dayTabs={dayTabs} activeDay={activeDay} setActiveDay={setActiveDay} />
          </div>

          {/* Day Theme Bar */}
          <div id="day-theme-bar" className="grid grid-cols-[140px_1px_1fr] md:grid-cols-[280px_1px_1fr] gap-4 md:gap-8 py-6 border-y border-border mb-0 items-center">
            <div className="text-right flex items-baseline justify-end gap-3">
              <span className="font-inter text-gold text-4xl md:text-5xl font-bold leading-none">
                {currentDay.date}
              </span>
              <span className="font-sans text-muted text-[16px]">{currentDay.weekday}</span>
            </div>
            <div className="w-px h-10 bg-border" />
            <p className="font-serif text-dark text-lg font-semibold">{currentDay.theme}</p>
          </div>

          {/* Sessions */}
          <div className="divide-y divide-border">
            {currentSessions.map((session, i) => (
              <div
                key={i}
                className={`grid grid-cols-[140px_1px_1fr] md:grid-cols-[280px_1px_1fr] gap-4 md:gap-8 py-8 md:py-10 ${
                  session.highlight ? "bg-cream/60 -mx-6 px-6 md:-mx-8 md:px-8" : ""
                }`}
              >
                <div className="text-right">
                  <p className="font-inter text-dark text-2xl md:text-3xl font-semibold leading-none">
                    {session.time}
                  </p>
                  {session.duration && (
                    <p className="font-inter text-muted-light text-[15px] mt-1">{session.duration}</p>
                  )}
                </div>

                <div className="w-px bg-border" />

                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span
                      className={`inline-block text-[15px] font-medium px-2.5 py-0.5 rounded ${
                        session.badge === "gold"
                          ? "bg-gold text-white"
                          : session.badge === "green"
                          ? "bg-green text-white"
                          : "bg-muted text-white"
                      }`}
                    >
                      {session.type}
                    </span>
                  </div>

                  {session.title && (
                    <h3 className="font-serif text-dark text-xl md:text-2xl font-semibold mb-1">
                      {session.title}
                    </h3>
                  )}

                  {session.venue && (
                    <p className="font-inter text-muted text-[16px]">
                      {session.venue}
                      {session.capacity && ` · ${session.capacity} 位`}
                    </p>
                  )}

                  {session.speakers && (
                    <div className="flex flex-wrap gap-4 mt-3">
                      {session.speakers.map((s) => (
                        <div key={s.name} className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-green-dark flex items-center justify-center shrink-0">
                            <Users className="w-3 h-3 text-white/60" />
                          </div>
                          <div>
                            <span className="font-sans text-[16px] text-dark font-medium">{s.name}</span>
                            {s.role && (
                              <span className="font-inter text-muted-light text-[15px] ml-2">{s.role}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {session.papers && (
                    <div className="mt-4 space-y-3">
                      {session.papers.map((paper) => (
                        <div key={paper.title} className="border border-border rounded-lg px-5 py-4 bg-cream/50">
                          <p className="font-serif text-dark text-[16px] font-medium">{paper.title}</p>
                          <p className="font-inter text-[15px] mt-1">
                            <span className="font-medium text-dark">{paper.author}</span>
                            <span className="text-muted ml-2">{paper.affiliation}</span>
                          </p>
                        </div>
                      ))}
                      {session.discussants && (
                        <p className="font-inter text-[16px] text-muted">
                          <span className="text-muted-light">與談人</span>{" "}
                          {session.discussants.join("、")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 導覽梯次 — Bold Editorial ═══ */}
      <section className="bg-cream" id="tour">
        {/* Gold top bar */}
        <div className="w-full h-1.5 bg-gold/30 relative overflow-hidden">
          <div
            className="absolute inset-y-0 w-[200px] animate-[shimmer_2.5s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #D4B85A 30%, #FAF8F5 50%, #D4B85A 70%, transparent 100%)",
            }}
          />
        </div>

        <div className="flex flex-col lg:flex-row w-full py-24 px-20 gap-12 lg:gap-20">
          {/* Left: Bold header */}
          <div className="flex flex-col w-full lg:w-[400px] shrink-0 gap-4">
            <p className="font-inter text-gold text-[16px] font-semibold tracking-[0.2em] uppercase leading-4">
              展覽參觀
            </p>
            <h2 className="font-serif text-dark text-[72px] md:text-[88px] lg:text-[100px] font-black leading-[1.1] tracking-[-0.02em]">
              導覽
              <br />
              梯次
            </h2>
            <div className="w-12 h-0.5 bg-gold" />
            <p className="font-sans text-muted text-[16px] leading-[26px]">
              每梯次七十五分鐘
              <br />
              三梯次，每梯次二十人
            </p>
          </div>

          {/* Right: Tour rows */}
          <div className="flex flex-col grow">
            {[
              { number: "01", title: "慈濟台灣與美國志工", sub: "二十人一梯次，75 分鐘", tag: "中文導覽" },
              { number: "02", title: "大陸與台灣學者貴賓", sub: "二十人一梯次，75 分鐘", tag: "中文導覽" },
              { number: "03", title: "歐美貴賓與學者", sub: "二十人一梯次，75 分鐘", tag: "英文導覽" },
            ].map((tour, i) => (
              <div
                key={tour.number}
                className={`flex items-center py-8 gap-6 md:gap-8 ${
                  i < 2 ? "border-b border-border" : ""
                }`}
              >
                <span className="font-inter text-[#D4B85A] text-[48px] md:text-[64px] font-extralight leading-none w-[60px] md:w-[100px] shrink-0">
                  {tour.number}
                </span>
                <div className="flex flex-col grow gap-1.5">
                  <span className="font-serif text-dark text-[20px] md:text-[24px] font-bold leading-[30px]">
                    {tour.title}
                  </span>
                  <span className="font-sans text-muted text-[16px] leading-[18px]">
                    {tour.sub}
                  </span>
                </div>
                <span className="shrink-0 rounded-[20px] py-2 px-5 bg-gold/10 border border-gold/25">
                  <span className="font-sans text-gold text-[16px] tracking-[0.08em] font-medium leading-4">
                    {tour.tag}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 場地 — Split Layout ═══ */}
      <VenueSection />

      {/* ═══ 講者 ═══ */}
      <section className="bg-cream py-20 px-6 md:px-20" id="speakers">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="font-inter text-gold text-[15px] tracking-[0.2em] uppercase mb-3">
              講者
            </p>
            <h2 className="font-serif text-dark text-3xl md:text-4xl font-bold mb-3">
              主講嘉賓
            </h2>
            <p className="font-inter text-muted text-[16px] max-w-xl mx-auto">
              來自世界各地的傑出學者與實踐者，共同分享佛教的當代智慧與願景。
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {speakers.map((speaker) => (
              <button
                key={speaker.name}
                onClick={() => setSelectedSpeaker(speaker)}
                className="group bg-white rounded-xl border border-border overflow-hidden text-left hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="aspect-[4/4] bg-cream-dark flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-light/30" />
                </div>
                <div className="p-4">
                  <p className="font-serif text-dark font-semibold">
                    {speaker.name}
                  </p>
                  <p className="font-inter text-muted text-[15px] mt-0.5">
                    {speaker.affiliation}
                  </p>
                  <p className="font-inter text-muted-light text-[15px] mt-0.5">
                    {speaker.title}
                  </p>
                  <span className="inline-block mt-2 font-inter text-[15px] text-gold group-hover:text-gold-light transition-colors">
                    更多 +
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 報名 ═══ */}
      <section className="bg-dark py-20 px-6 md:px-20 text-center" id="register">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-cream text-2xl md:text-3xl font-bold leading-relaxed mb-3 whitespace-pre-line">
            {"共赴一場跨越時空的\n菩薩道學思之旅"}
          </h2>
          <p className="font-inter text-cream/50 text-[16px] mb-10">
            邀請學者、實踐者與思想領袖齊聚哈佛大學，共同探索佛教的未來。
          </p>
          <a
            href="#register"
            className="inline-block font-inter text-[16px] font-medium text-cream border border-gold hover:bg-gold hover:text-dark px-10 py-3.5 rounded-full transition-colors"
          >
            報名參加學思會
          </a>
        </div>
      </section>

      {/* ═══ Sticky Day Tabs ═══ */}
      <StickyDayTabs dayTabs={dayTabs} activeDay={activeDay} setActiveDay={setActiveDay} currentDay={currentDay} />

      {/* ═══ Speaker Modal ═══ */}
      <SpeakerModal
        speaker={selectedSpeaker}
        onClose={() => setSelectedSpeaker(null)}
      />
    </>
  );
}

/* ─── Venue Section (with scroll animations) ─── */
function VenueSection() {
  const header = useScrollReveal<HTMLDivElement>();
  const loc1 = useScrollReveal<HTMLDivElement>();
  const loc2 = useScrollReveal<HTMLDivElement>();
  const loc3 = useScrollReveal<HTMLDivElement>();

  return (
    <section className="bg-[#FAF8F5] relative overflow-hidden" id="venue">
      {/* ── Top decorative wave ── */}
      <div className="w-full h-[80px] relative overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,80 C360,20 720,60 1080,10 C1260,-10 1380,30 1440,20 L1440,0 L0,0 Z" fill="#F5F1EB" />
        </svg>
      </div>

      {/* Header */}
      <div
        ref={header.ref}
        className={`flex flex-col items-center w-full pt-6 pb-10 gap-3 px-6 md:px-20 transition-all duration-700 ${header.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <p className="font-inter text-gold text-[16px] font-semibold tracking-[0.25em] uppercase leading-4">
          場地介紹
        </p>
        <h2 className="font-serif text-dark text-[40px] md:text-[48px] font-bold leading-[58px]">
          活動地點
        </h2>
        <div className="flex items-center gap-2.5 mt-1">
          <div className={`h-px bg-gold/40 transition-all duration-700 delay-300 ${header.isVisible ? "w-10" : "w-0"}`} />
          <div className={`w-[5px] h-[5px] rounded-full bg-gold transition-all duration-500 delay-500 ${header.isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
          <div className={`h-px bg-gold/40 transition-all duration-700 delay-300 ${header.isVisible ? "w-10" : "w-0"}`} />
        </div>
      </div>

      {/* Location 01 — Image Left, Text Right */}
      <div
        ref={loc1.ref}
        className={`w-full h-auto md:h-[360px] flex flex-col md:flex-row transition-all duration-700 ${loc1.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      >
        <div className="relative w-full md:w-1/2 h-[240px] md:h-full overflow-hidden">
          <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ${loc1.isVisible ? "scale-100" : "scale-110"}`} style={{ backgroundImage: "url('/img/soch.webp')" }} />
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(135deg, rgba(61,58,54,0.6) 0%, rgba(90,85,75,0.4) 50%, rgba(155,148,136,0.3) 100%)" }} />
          <div className={`absolute top-[60px] left-[40px] w-[200px] h-[200px] rounded-full border border-white/10 transition-all duration-1000 delay-300 ${loc1.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
          <div className={`absolute top-[100px] left-[80px] w-[120px] h-[120px] rounded-full border border-white/10 transition-all duration-1000 delay-500 ${loc1.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
        </div>
        <div className={`w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-10 md:py-0 gap-3 bg-[#FAF8F5] transition-all duration-700 delay-200 ${loc1.isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
          <span className="font-inter text-gold/20 text-[72px] font-extralight leading-none">01</span>
          <h3 className="font-serif text-dark text-[28px] md:text-[32px] font-bold leading-[44px]">
            哈佛大學學生社團中心 (SOCH)
          </h3>
          <p className="font-sans text-[#5A554B] text-[14px] font-light leading-[26px] max-w-[460px]">
            為期三天的學術發表、論壇及交流活動之主場地，提供國際級研討會設施與舒適環境。
          </p>
          <div className="flex items-center mt-1 gap-2">
            <MapPin className="w-4 h-4 text-gold" />
            <span className="font-sans text-gold text-[13px] leading-4">59 Shepard St, Cambridge, MA 02138</span>
          </div>
        </div>
      </div>

      {/* Location 02 — Text Left, Image Right */}
      <div
        ref={loc2.ref}
        className={`w-full h-auto md:h-[360px] flex flex-col md:flex-row transition-all duration-700 ${loc2.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      >
        <div className={`w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-10 md:py-0 gap-3 bg-[#FAF8F5] order-2 md:order-1 transition-all duration-700 delay-200 ${loc2.isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
          <span className="font-inter text-gold/20 text-[72px] font-extralight leading-none">02</span>
          <h3 className="font-serif text-dark text-[28px] md:text-[32px] font-bold leading-[44px]">
            哈佛教職員俱樂部
          </h3>
          <p className="font-sans text-[#5A554B] text-[14px] font-light leading-[26px] max-w-[460px]">
            晚宴及交流活動場地，提供優雅的用餐環境與學術交流空間。
          </p>
          <div className="flex items-center mt-1 gap-2">
            <MapPin className="w-4 h-4 text-gold" />
            <span className="font-sans text-gold text-[13px] leading-4">20 Quincy St, Cambridge, MA 02138</span>
          </div>
        </div>
        <div className="relative w-full md:w-1/2 h-[240px] md:h-full overflow-hidden order-1 md:order-2">
          <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ${loc2.isVisible ? "scale-100" : "scale-110"}`} style={{ backgroundImage: "url('/img/music.webp')" }} />
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(225deg, rgba(26,50,40,0.5) 0%, rgba(61,90,62,0.4) 50%, rgba(100,140,100,0.3) 100%)" }} />
          <div className={`absolute bottom-[60px] right-[60px] w-[160px] h-[160px] rounded-[20px] border border-white/10 rotate-12 transition-all duration-1000 delay-400 ${loc2.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
        </div>
      </div>

      {/* Location 03 — Image Left, Text Right */}
      <div
        ref={loc3.ref}
        className={`w-full h-auto md:h-[360px] flex flex-col md:flex-row transition-all duration-700 ${loc3.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      >
        <div className="relative w-full md:w-1/2 h-[240px] md:h-full overflow-hidden">
          <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ${loc3.isVisible ? "scale-100" : "scale-110"}`} style={{ backgroundImage: "url('/img/hall.jpg')" }} />
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(135deg, rgba(90,74,42,0.5) 0%, rgba(155,123,47,0.3) 50%, rgba(200,180,100,0.2) 100%)" }} />
          <div className={`absolute top-[50px] left-[50px] w-[180px] h-[140px] rounded-[20px] border border-white/10 transition-all duration-1000 delay-300 ${loc3.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
          <div className={`absolute top-[90px] left-[90px] w-[100px] h-[100px] rounded-full border border-white/10 transition-all duration-1000 delay-500 ${loc3.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
        </div>
        <div className={`w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-10 md:py-0 gap-3 bg-[#FAF8F5] transition-all duration-700 delay-200 ${loc3.isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
          <span className="font-inter text-gold/20 text-[72px] font-extralight leading-none">03</span>
          <h3 className="font-serif text-dark text-[28px] md:text-[32px] font-bold leading-[44px]">
            哈佛藝術博物館 Adolphus Busch Hall
          </h3>
          <p className="font-sans text-[#5A554B] text-[14px] font-light leading-[26px] max-w-[460px]">
            「明心」特別展覽及開幕晚會場地，結合藝術與科技的創新展覽空間。
          </p>
          <div className="flex items-center mt-1 gap-2">
            <MapPin className="w-4 h-4 text-gold" />
            <span className="font-sans text-gold text-[13px] leading-4">29 Kirkland St, Cambridge, MA 02138</span>
          </div>
        </div>
      </div>

      {/* ── Bottom decorative wave ── */}
      <div className="w-full h-[100px] relative overflow-hidden" style={{ transform: "scaleX(-1) scaleY(-1)" }}>
        <svg className="w-full h-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,80 C360,20 720,60 1080,10 C1260,-10 1380,30 1440,20 L1440,0 L0,0 Z" fill="#F5F1EB" />
        </svg>
      </div>
    </section>
  );
}

/* ─── Original Day Tabs (in header) ─── */
function DayTabsOriginal({ dayTabs, activeDay, setActiveDay }: {
  dayTabs: { label: string }[];
  activeDay: number;
  setActiveDay: (i: number) => void;
}) {
  return (
    <div className="flex gap-2 mt-6 md:mt-0" id="day-tabs-original">
      {dayTabs.map((tab, i) => (
        <button
          key={i}
          onClick={() => setActiveDay(i)}
          className={`font-inter text-[16px] px-5 py-2.5 rounded-full border transition-colors ${
            activeDay === i
              ? "bg-dark text-cream border-dark"
              : "bg-transparent text-muted border-border hover:border-dark hover:text-dark"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Sticky Day Tabs (appears when original scrolls away) ─── */
function StickyDayTabs({ dayTabs, activeDay, setActiveDay, currentDay }: {
  dayTabs: { label: string; date: string; weekday: string; theme: string }[];
  activeDay: number;
  setActiveDay: (i: number) => void;
  currentDay: { date: string; weekday: string; theme: string };
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const themeBar = document.getElementById("day-theme-bar");
      const section = document.getElementById("programme");
      if (!themeBar || !section) return;
      const themeRect = themeBar.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const pastThemeBar = themeRect.bottom < 64;
      const stillInSection = sectionRect.bottom > 150;
      setShow(pastThemeBar && stillInSection);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`fixed top-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
      <div className="flex justify-center gap-2 py-3">
        {dayTabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => {
              setActiveDay(i);
              const el = document.getElementById("day-theme-bar");
              if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 64;
                window.scrollTo({ top: y, behavior: "smooth" });
              }
            }}
            className={`font-inter text-[16px] px-5 py-2.5 rounded-full border transition-colors flex flex-col items-center gap-0.5 ${
              activeDay === i
                ? "bg-dark text-cream border-dark"
                : "bg-transparent text-muted border-border hover:border-dark hover:text-dark"
            }`}
          >
            <span className="font-medium">{tab.label}</span>
            <span className={`text-[15px] font-bold ${activeDay === i ? "text-gold" : "text-gold/60"}`}>{tab.theme}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
