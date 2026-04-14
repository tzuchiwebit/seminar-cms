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
  Mic,
  FileText,
  MessageCircle,
  UtensilsCrossed,
  Camera,
  DoorOpen,
  ClipboardList,
  Palette,
} from "lucide-react";

import SpeakerModal from "@/components/public/SpeakerModal";
import Navbar from "@/components/public/Navbar";
import FloatingRegister from "@/components/public/FloatingRegister";
import Footer from "@/components/public/Footer";

/* ─── Types ─── */

type PaperItem = { title: string; author: string; affiliation: string };
type SpeakerItem = { name: string; role?: string };
type SessionItem = {
  time: string;
  duration?: string;
  type: string;
  badge: "gold" | "green" | "muted";
  title?: string;
  subtitle?: string;
  speakers?: SpeakerItem[];
  papers?: PaperItem[];
  discussants?: string[];
  venue?: string;
  capacity?: number;
  highlight?: boolean;
  groupPhoto?: boolean;
};

/* ─── Scroll Animation Hook ─── */
function useScrollReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/* ─── Animated Counter Hook ─── */
function useCountUp(target: number, isVisible: boolean, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const startTime = performance.now();
    function step(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [isVisible, target, duration]);
  return count;
}

/* ─── Fade-up CSS classes ─── */
const fadeUp = (visible: boolean, delay = 0) =>
  `transition-all ease-out ${delay ? `delay-[${delay}ms]` : ""} ${
    visible
      ? "opacity-100 translate-y-0 duration-700"
      : "opacity-0 translate-y-8 duration-700"
  }`;

/* ─── Props ─── */

type HomePageProps = {
  days: any[];
  speakers: any[];
  settings: Record<string, string>;
  siteName: string;
  slug: string;
  exhibitions: any[];
  venues: any[];
};

/* ─── Helpers ─── */

function getBadge(type: string): "gold" | "green" | "muted" {
  if (["keynote", "opening", "roundtable", "closing", "photo"].includes(type)) return "gold";
  if (["paper_session"].includes(type)) return "green";
  return "muted";
}

function getTypeLabel(type: string, titleZh: string, lang: "zh" | "en" = "zh"): string {
  const labelsZh: Record<string, string> = {
    registration: "報到", opening: "開幕典禮", keynote: "專題演講",
    paper_session: "論文發表", roundtable: "圓桌論壇", break: "茶敘",
    dinner: "晚宴", closing: "閉幕", photo: "大合照", exhibition: "展覽",
  };
  const labelsEn: Record<string, string> = {
    registration: "Registration", opening: "Opening Ceremony", keynote: "Keynote",
    paper_session: "Paper Session", roundtable: "Roundtable", break: "Break",
    dinner: "Dinner", closing: "Closing", photo: "Group Photo", exhibition: "Exhibition",
  };
  if (lang === "en") return labelsEn[type] || titleZh;
  return labelsZh[type] || titleZh;
}

/* ─── Page ─── */

export default function HomePage({ days, speakers, settings, siteName, slug, exhibitions, venues }: HomePageProps) {
  /* ── State (must be before derived data that uses lang) ── */
  const [selectedSpeaker, setSelectedSpeaker] = useState<any>(null);
  const [activeDay, setActiveDay] = useState(0);
  const siteLang = settings.site_language || "both"; // "en", "zh", or "both"
  const [lang, setLang] = useState<"zh" | "en">(() => {
    if (siteLang === "en") return "en";
    if (siteLang === "zh") return "zh";
    // "both" — detect from browser
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language || navigator.languages?.[0] || "en";
      return browserLang.startsWith("zh") ? "zh" : "en";
    }
    return "en";
  });
  const showLangToggle = siteLang === "both";

  /* ── Derive display data from props ── */

  const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];
  const weekdayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayTabs = days.map((d) => {
    const dt = new Date(d.date);
    return {
      label: lang === "en"
        ? `${dt.getMonth() + 1}/${dt.getDate()} (${weekdayNamesEn[dt.getDay()]})`
        : `${dt.getMonth() + 1}/${dt.getDate()} (${weekdayNames[dt.getDay()]})`,
      date: `${dt.getMonth() + 1}.${dt.getDate()}`,
      weekday: lang === "en" ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dt.getDay()] : `星期${weekdayNames[dt.getDay()]}`,
      theme: lang === "en" ? (d.titleEn || d.titleZh) : d.titleZh,
    };
  });

  const daySessions: SessionItem[][] = days.map((day) =>
    day.sessions
      .map((s: any) => ({
        time: s.startTime.replace(/^0/, "").replace(/^(\d{1,2}):(\d{2})$/, (_: string, h: string, m: string) => {
          const hour = parseInt(h);
          return hour > 12 ? `${hour - 12}:${m}` : `${h}:${m}`;
        }),
        duration: s.duration ? (lang === "en"
          ? `${parseInt(s.startTime) < 12 ? "AM" : "PM"} · ${s.duration} min`
          : `${parseInt(s.startTime) < 12 ? "上午" : "下午"} · ${s.duration} 分鐘`) : undefined,
        type: getTypeLabel(s.type, s.titleZh, lang),
        badge: getBadge(s.type),
        title: lang === "en" ? (s.titleEn || s.titleZh || undefined) : (s.titleZh || s.titleEn || undefined),
        subtitle: lang === "en" ? (s.subtitleEn || s.subtitleZh || undefined) : (s.subtitleZh || s.subtitleEn || undefined),
        speakers: s.sessionSpeakers?.filter((ss: any) => ss.role !== "discussant").map((ss: any) => ({
          name: ss.speaker.name,
          role: ss.role === "moderator" ? "Moderator" : undefined,
        })) || undefined,
        papers: s.papers?.length > 0 ? s.papers.map((p: any) => ({
          title: lang === "en" ? (p.titleEn || p.titleZh) : (p.titleZh || p.titleEn),
          author: p.speaker?.name || "",
          affiliation: lang === "en" ? (p.speaker?.affiliation || p.speaker?.affiliationZh || "") : (p.speaker?.affiliationZh || p.speaker?.affiliation || ""),
        })) : undefined,
        discussants: s.sessionSpeakers?.filter((ss: any) => ss.role === "discussant").length > 0
          ? s.sessionSpeakers.filter((ss: any) => ss.role === "discussant").map((ss: any) => ss.speaker.name)
          : undefined,
        venue: s.venue || undefined,
        capacity: s.capacity || undefined,
        highlight: s.type === "keynote",
        groupPhoto: s.groupPhoto || false,
      }))
  );

  const firstDate = days.length > 0 ? new Date(days[0].date) : new Date();
  const lastDate = days.length > 0 ? new Date(days[days.length - 1].date) : new Date();
  const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateRange = lang === "en"
    ? `${monthNamesEn[firstDate.getMonth()]} ${firstDate.getDate()}–${lastDate.getDate()}, ${firstDate.getFullYear()}`
    : `${firstDate.getFullYear()}年${firstDate.getMonth() + 1}月${firstDate.getDate()}日─${lastDate.getDate()}日`;
  const mainVenue = venues.find((v: any) => v.type === "main");
  const infoCards = [
    { icon: Calendar, title: dateRange, sub: `${days.length}${lang === "en" ? " Days" : "天學術交流與展覽"}` },
    { icon: MapPin, title: mainVenue ? (lang === "en" ? mainVenue.name : mainVenue.nameZh || mainVenue.name) : "", sub: mainVenue?.address || "" },
    { icon: Users, title: lang === "en" ? "Organizers" : "主辦單位", sub: settings.organizers || siteName },
  ];

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    BookOpen, Lightbulb, Heart, Globe, Users, Calendar, MapPin, Eye,
  };

  // Compute dynamic counts for highlight templates
  const totalSessions0 = days.flatMap((d: any) => d.sessions);
  let parsedHighlights: any[] = [];
  if (settings.description_highlights) {
    try {
      const parsed = JSON.parse(settings.description_highlights);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsedHighlights = parsed.map((h: any) => ({
          ...h,
          label: lang === "en" && h.labelEn ? h.labelEn : h.label,
        }));
      }
    } catch { /* ignore */ }
  }

  const descriptionData = {
    headline: lang === "en"
      ? (settings.description_headline_en || settings.description_headline || "")
      : (settings.description_headline || "一場探索佛教未來的學術盛會"),
    body: lang === "en"
      ? (settings.description_body_en || settings.description_body || "")
      : (settings.description_body || "「全球共善學思會」匯聚國際佛學研究者、宗教實踐者與人文學者，以學術發表、圓桌論壇與沉浸式藝術體驗，深入探討應用佛教、菩薩道精神與佛教藝術的當代轉譯。本次學思會由慈濟基金會與哈佛大學 CAMLab 共同主辦，期盼在學術對話中，為佛教的未來開展新的視野與可能。"),
    highlights: parsedHighlights,
  };

  const totalSessions = days.flatMap((d: any) => d.sessions);
  const paperSessionCount = totalSessions.filter((s: any) => s.type === "paper_session").length;
  const roundtableCount = totalSessions.filter((s: any) => s.type === "roundtable").length;
  const stats = lang === "en" ? [
    { number: String(days.length), label: "Days of Exchange" },
    { number: String(paperSessionCount), label: "Paper Sessions" },
    { number: String(roundtableCount), label: "Roundtables" },
    { number: "1", label: "Immersive Exhibition" },
  ] : [
    { number: String(days.length), label: "天學術交流" },
    { number: String(paperSessionCount), label: "場論文發表" },
    { number: String(roundtableCount), label: "場圓桌論壇" },
    { number: "1", label: "沉浸式展覽" },
  ];

  const speakerList = speakers.map((s: any) => ({
    name: s.name,
    nameCn: s.nameCn || null,
    photo: s.photo || null,
    affiliation: s.affiliation || "",
    affiliationZh: s.affiliationZh || undefined,
    title: s.title_field || s.title || "",
    titleZh: s.titleZh || undefined,
    bio: s.bio || undefined,
    topicZh: s.papers?.[0]?.titleEn || s.papers?.[0]?.titleZh || undefined,
    papers: s.papers?.map((p: any) => p.titleEn || p.titleZh) || [],
    tags: s.sessionSpeakers?.map((ss: any) => {
      const dt = new Date(ss.session.day.date);
      const role = ss.role === "moderator" ? "Moderator" : ss.role === "discussant" ? "Commentator"
        : (lang === "en" ? (ss.session.titleEn || ss.session.titleZh) : ss.session.titleZh);
      return `${dt.getMonth() + 1}/${dt.getDate()} · ${role}`;
    }) || [],
  }));

  /* ── Derived state ── */
  const currentDay = dayTabs[activeDay];
  const currentSessions = daySessions[activeDay] || [];

  // Scroll reveal refs
  const descSection = useScrollReveal<HTMLDivElement>(0.1);
  const highlightsSection = useScrollReveal<HTMLDivElement>(0.2);
  const programmeSection = useScrollReveal<HTMLDivElement>(0.1);
  const speakersSection = useScrollReveal<HTMLDivElement>(0.01);
  const tourSection = useScrollReveal<HTMLDivElement>(0.1);

  // Set page title and favicon dynamically
  useEffect(() => {
    const title = lang === "en"
      ? (settings.og_title_en || settings.site_name_en || settings.og_title || siteName)
      : (settings.og_title || siteName);
    if (title) document.title = title;

    if (settings.favicon) {
      // Remove existing favicons
      document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']").forEach((el) => el.remove());
      // Add new favicon
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = settings.favicon;
      document.head.appendChild(link);
    }
  }, [settings.favicon, settings.og_title, settings.og_title_en, siteName]);

  return (
    <>
      {/* ═══ Hero Banner ═══ */}
      <section id="about" className="w-full">
        {/* Desktop banner */}
        <img
          src={settings.banner_image || "/img/about-banner.jpg"}
          alt={settings.og_title_en || settings.og_title || siteName}
          className={`w-full h-auto ${settings.banner_image_mobile ? "hidden md:block" : "block"}`}
        />
        {/* Mobile banner */}
        {settings.banner_image_mobile && (
          <img
            src={settings.banner_image_mobile}
            alt={settings.og_title_en || settings.og_title || siteName}
            className="w-full h-auto block md:hidden"
          />
        )}
      </section>

      {/* ═══ Navbar (after banner, sticky) ═══ */}
      <Navbar slug={slug} lang={lang} settings={settings} />

      {/* ═══ 活動簡介 — Paper Design ═══ */}
      {settings.section_description_visible !== "false" && <section className="bg-white px-6 md:px-20 min-h-[calc(100vh-64px)] flex items-center py-10" id="description">
        <div ref={descSection.ref} className="mx-auto max-w-6xl w-full">
          {/* Gold Divider — Top (draw-in animation) */}
          <div className="flex items-center justify-center mb-8">
            <div className={`h-px bg-gold/40 transition-all duration-1000 ${descSection.isVisible ? "w-24" : "w-0"}`} />
            <div className={`w-2.5 h-2.5 rotate-45 border border-gold/40 mx-4 transition-all duration-500 delay-500 ${descSection.isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
            <div className={`h-px bg-gold/40 transition-all duration-1000 ${descSection.isVisible ? "w-24" : "w-0"}`} />
          </div>

          {/* Header + Content side by side */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start transition-all duration-700 delay-300 ${descSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {/* Left: Paper-style header */}
            <div className="lg:col-span-4">
              <p className="font-inter text-gold text-[15px] font-semibold tracking-[0.2em] uppercase mb-4">
                {lang === "en" ? "ABOUT" : "關於"}
              </p>
              <h2 className="font-serif text-dark text-[30px] md:text-[36px] lg:text-[42px] font-bold leading-[1.1] tracking-[-0.02em]">
                {lang === "en" ? <>Event<br />Overview</> : <>活動<br />簡介</>}
              </h2>
              <div className="w-12 h-[2px] bg-gold mt-5" />
            </div>

            {/* Right: Headline + Body */}
            <div className="lg:col-span-8 lg:pt-6">
              <h3 className="font-serif text-dark text-2xl md:text-3xl font-bold leading-tight mb-5">
                {descriptionData.headline}
              </h3>
              <p className="font-sans text-muted text-[15px] leading-[1.8]">
                {descriptionData.body}
              </p>
            </div>
          </div>

          {/* Highlights — 4 across (staggered fade-up) */}
          <div ref={highlightsSection.ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mt-8 md:mt-10">
            {descriptionData.highlights.map((item: any, idx: number) => {
              const Icon = typeof item.icon === "string" ? iconMap[item.icon] || BookOpen : item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-4 border border-border rounded-xl p-5 bg-white/60 transition-all duration-500 ${highlightsSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                  style={{ transitionDelay: highlightsSection.isVisible ? `${idx * 150}ms` : "0ms" }}
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <p className="font-serif text-dark text-[15px] font-semibold">{item.label}</p>
                </div>
              );
            })}
          </div>

          {/* Gold Divider — Bottom (draw-in) */}
          <div className="flex items-center justify-center mt-8">
            <div className={`h-px bg-gold/40 transition-all duration-1000 delay-700 ${highlightsSection.isVisible ? "w-24" : "w-0"}`} />
            <div className={`w-2.5 h-2.5 rotate-45 border border-gold/40 mx-4 transition-all duration-500 delay-1000 ${highlightsSection.isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
            <div className={`h-px bg-gold/40 transition-all duration-1000 delay-700 ${highlightsSection.isVisible ? "w-24" : "w-0"}`} />
          </div>
        </div>
      </section>}


      {/* ═══ 導覽梯次 — Bold Editorial ═══ */}
      {settings.section_tour_visible !== "false" && <section className="bg-cream min-h-[calc(100vh-64px)] flex flex-col justify-center" id="tour">
        <div className="w-full h-1.5 bg-gold/30 relative overflow-hidden">
          <div
            className="absolute inset-y-0 w-[200px] animate-[shimmer_2.5s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #D4B85A 30%, #FAF8F5 50%, #D4B85A 70%, transparent 100%)",
            }}
          />
        </div>
        <div className="flex flex-col lg:flex-row w-full py-10 md:py-16 lg:py-24 px-6 md:px-12 lg:px-20 gap-6 md:gap-10 lg:gap-20">
          <div className="flex flex-col w-full lg:w-[400px] shrink-0 gap-3 md:gap-4">
            <p className="font-inter text-gold text-[13px] md:text-[16px] font-semibold tracking-[0.2em] uppercase leading-4">
              {lang === "en" ? "EXHIBITION TOUR" : "展覽參觀"}
            </p>
            <h2 className="font-serif text-dark text-[40px] md:text-[60px] lg:text-[100px] font-black leading-[1.1] tracking-[-0.02em]">
              {lang === "en" ? <>Tour<br />Groups</> : <>導覽<br />梯次</>}
            </h2>
            <div className="w-12 h-0.5 bg-gold" />
            <p className="font-sans text-muted text-[14px] md:text-[16px] leading-[24px] md:leading-[26px] whitespace-pre-line">
              {lang === "en"
                ? (settings.tour_header_en || settings.tour_header || "75 minutes per group\n3 groups, 20 people each")
                : (settings.tour_header || "每梯次七十五分鐘\n三梯次，每梯次二十人")}
            </p>
          </div>
          <div className="flex flex-col grow">
            {(() => {
              const defaultTours = [
                { number: "01", title: "慈濟台灣與美國志工", sub: "二十人一梯次，75 分鐘", tag: "中文導覽" },
                { number: "02", title: "大陸與台灣學者貴賓", sub: "二十人一梯次，75 分鐘", tag: "中文導覽" },
                { number: "03", title: "歐美貴賓與學者", sub: "二十人一梯次，75 分鐘", tag: "英文導覽" },
              ];
              let tours = defaultTours;
              if (settings.tour_groups) {
                try {
                  const parsed = JSON.parse(settings.tour_groups);
                  if (Array.isArray(parsed) && parsed.length > 0) tours = parsed;
                } catch { /* use defaults */ }
              }
              return tours;
            })().map((tour: any, i: number) => (
              <div key={tour.number} className={`flex items-start md:items-center py-5 md:py-8 gap-3 md:gap-6 ${i < 2 ? "border-b border-border" : ""}`}>
                <span className="font-inter text-[#D4B85A] text-[32px] md:text-[48px] lg:text-[64px] font-extralight leading-none w-[44px] md:w-[70px] lg:w-[100px] shrink-0">{tour.number}</span>
                <div className="flex flex-col grow gap-1 md:gap-1.5 min-w-0">
                  <span className="font-serif text-dark text-[15px] md:text-[20px] lg:text-[24px] font-bold leading-snug">{lang === "en" ? (tour.titleEn || tour.title) : tour.title}</span>
                  <span className="font-sans text-muted text-[12px] md:text-[16px] leading-[18px]">{lang === "en" ? (tour.subEn || tour.sub) : tour.sub}</span>
                  {/* Tag inline on mobile */}
                  <span className="inline-flex self-start md:hidden mt-1 rounded-[20px] py-1 px-2.5 bg-gold/10 border border-gold/25">
                    <span className="font-sans text-gold text-[11px] tracking-[0.08em] font-medium leading-4 whitespace-nowrap">{lang === "en" ? (tour.tagEn || tour.tag) : tour.tag}</span>
                  </span>
                </div>
                <span className="hidden md:inline-flex shrink-0 rounded-[20px] py-2 px-4 lg:px-5 bg-gold/10 border border-gold/25">
                  <span className="font-sans text-gold text-[14px] lg:text-[16px] tracking-[0.08em] font-medium leading-4 whitespace-nowrap">{lang === "en" ? (tour.tagEn || tour.tag) : tour.tag}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom shimmer bar */}
        <div className="w-full h-1.5 bg-gold/30 relative overflow-hidden">
          <div
            className="absolute inset-y-0 w-[200px] animate-[shimmer_2.5s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #D4B85A 30%, #FAF8F5 50%, #D4B85A 70%, transparent 100%)",
            }}
          />
        </div>
      </section>}

      {/* ═══ 議程 ═══ */}
      {settings.section_programme_visible !== "false" && <section className="bg-white py-12 md:py-20 px-4 md:px-12 lg:px-20" id="programme">
        <div ref={programmeSection.ref}>
          <div className={`flex flex-col md:flex-row md:items-end md:justify-between mb-12 transition-all duration-700 ${programmeSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div>
              <p className="font-inter text-gold text-[15px] tracking-[0.2em] uppercase mb-3">
                {lang === "en" ? "PROGRAMME" : "議程"}
              </p>
              <h2 className="font-serif text-dark text-3xl md:text-5xl lg:text-6xl font-bold">
                {lang === "en" ? `${days.length}-Day Programme` : `${["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"][days.length] || days.length}日議程`}
              </h2>
            </div>
            <DayTabsOriginal dayTabs={dayTabs} activeDay={activeDay} setActiveDay={setActiveDay} />
          </div>

          {/* Day Theme Bar */}
          <div id="day-theme-bar" className="grid grid-cols-[80px_1px_1fr] md:grid-cols-[140px_1px_1fr] lg:grid-cols-[180px_1px_1fr] gap-2 md:gap-4 lg:gap-6 py-4 md:py-6 border-y border-border mb-0 items-center">
            <div className="text-right flex flex-col items-end">
              <span className="font-inter text-gold text-2xl md:text-3xl font-bold leading-none">
                {currentDay?.date}
              </span>
              <span className="font-sans text-muted text-[11px] md:text-[13px] mt-1">{currentDay?.weekday}</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <p className="font-serif text-dark text-2xl md:text-3xl font-bold">{currentDay?.theme}</p>
          </div>

          {/* Sessions */}
          <div className="divide-y divide-border">
            {currentSessions.map((session, i) => (
              <div
                key={i}
                className={`grid grid-cols-[80px_1px_1fr] md:grid-cols-[140px_1px_1fr] lg:grid-cols-[180px_1px_1fr] gap-2 md:gap-4 lg:gap-6 py-3 md:py-5 ${
                  session.highlight ? "bg-cream/60 -mx-4 px-4 md:-mx-6 md:px-6" : ""
                }`}
              >
                <div className="text-right">
                  <p className="font-inter text-dark text-lg font-semibold leading-none">
                    {session.time}
                  </p>
                  {session.duration && (
                    <p className="font-inter text-muted-light text-[11px] mt-0.5">{session.duration}</p>
                  )}
                </div>

                <div className="w-px bg-border" />

                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[13px] font-medium px-2 py-0.5 rounded ${
                        session.badge === "gold"
                          ? "bg-gold text-white"
                          : session.badge === "green"
                          ? "bg-green text-white"
                          : "bg-muted text-white"
                      }`}
                    >
                      {(() => {
                        const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
                          // Chinese
                          "專題演講": Mic, "專題演講 I": Mic,
                          "論文發表": FileText,
                          "圓桌論壇": MessageCircle, "圓桌論壇 II": MessageCircle,
                          "開幕典禮": DoorOpen,
                          "閉幕": DoorOpen,
                          "晚宴": UtensilsCrossed,
                          "報到": ClipboardList,
                          "大合照": Camera,
                          "展覽導覽": Eye, "展覽": Palette, "展覽活動": Palette,
                          "綜合討論": MessageCircle,
                          "場次一": FileText, "場次二": FileText, "場次三": FileText, "場次四": FileText,
                          // English
                          "Keynote": Mic, "Keynote I": Mic,
                          "Paper Session": FileText,
                          "Roundtable": MessageCircle, "Roundtable II": MessageCircle,
                          "Opening Ceremony": DoorOpen,
                          "Closing": DoorOpen,
                          "Dinner": UtensilsCrossed,
                          "Registration": ClipboardList,
                          "Group Photo": Camera,
                          "Exhibition Tour": Eye, "Exhibition": Palette, "Exhibition Event": Palette,
                          "General Discussion": MessageCircle,
                          "Session I": FileText, "Session II": FileText, "Session III": FileText, "Session IV": FileText,
                        };
                        const TypeIcon = typeIcons[session.type];
                        return TypeIcon ? <TypeIcon className="w-3.5 h-3.5" /> : null;
                      })()}
                      {session.type}
                    </span>
                    {session.groupPhoto && (
                      <span className="font-inter text-[11px] font-medium px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/20 flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        {lang === "en" ? "Group Photo" : "大合照"}
                      </span>
                    )}
                  </div>

                  {session.title && (
                    <h3 className="font-serif text-dark text-[14px] md:text-[15px] font-semibold mb-1">
                      {session.title}
                    </h3>
                  )}

                  {session.subtitle && (
                    <p className="font-sans text-muted text-[13px] leading-relaxed whitespace-pre-line mt-1">
                      {session.subtitle}
                    </p>
                  )}

                  {session.venue && (
                    <p className="font-inter text-muted text-[13px]">
                      {session.venue}
                      {session.capacity && ` · ${session.capacity} 位`}
                    </p>
                  )}

                  {session.speakers && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {session.speakers.map((s) => (
                        <div key={s.name} className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-green-dark flex items-center justify-center shrink-0">
                            <Users className="w-2.5 h-2.5 text-white/60" />
                          </div>
                          <div>
                            <span className="font-sans text-[13px] text-dark font-medium">{s.name}</span>
                            {s.role && (
                              <span className="font-inter text-muted-light text-[12px] ml-1.5">{s.role}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {session.papers && (
                    <div className="mt-3 space-y-2">
                      {session.papers.map((paper) => (
                        <div key={paper.title} className="border border-border rounded-md px-4 py-3 bg-cream/50">
                          <p className="font-serif text-dark text-[13px] font-medium">{paper.title}</p>
                          <p className="font-inter text-[12px] mt-0.5">
                            <span className="font-medium text-dark">{paper.author}</span>
                            <span className="text-muted ml-1.5">{paper.affiliation}</span>
                          </p>
                        </div>
                      ))}
                      {session.discussants && (
                        <p className="font-inter text-[13px] text-muted">
                          <span className="text-muted-light">{lang === "en" ? "Discussants" : "與談人"}</span>{" "}
                          {session.discussants.join(lang === "en" ? ", " : "、")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* ═══ 場地 — Split Layout ═══ */}
      {settings.section_venues_visible !== "false" && venues.length > 0 && <VenueSection venues={venues} lang={lang} />}

      {/* ═══ 講者 ═══ */}
      {settings.section_speakers_visible !== "false" && <section className="bg-cream px-4 md:px-20 py-12 md:py-20" id="speakers">
        <div ref={speakersSection.ref} className="mx-auto w-full max-w-5xl">
          <div className={`text-center mb-14 transition-all duration-700 ${speakersSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <p className="font-inter text-gold text-[15px] tracking-[0.2em] uppercase mb-3">
              {lang === "en" ? "SPEAKERS" : "講者"}
            </p>
            <h2 className="font-serif text-dark text-3xl md:text-4xl font-bold mb-3">
              {lang === "en" ? "Distinguished Speakers" : "主講嘉賓"}
            </h2>
            <p className="font-inter text-muted text-[16px] max-w-xl mx-auto">
              {lang === "en"
                ? (settings.speakers_subtitle_en || "Distinguished scholars and practitioners from around the world.")
                : (settings.speakers_subtitle || "來自世界各地的傑出學者與實踐者，共同分享佛教的當代智慧與願景。")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-5 items-start">
            {speakerList.map((speaker, idx) => (
              <button
                key={speaker.name}
                onClick={() => settings.speakers_see_more !== "false" && setSelectedSpeaker(speaker)}
                style={{ transitionDelay: speakersSection.isVisible ? `${300 + idx * 80}ms` : "0ms" }}
                className={`group bg-white rounded-xl border border-border overflow-hidden text-left transition-all duration-500 flex flex-col ${settings.speakers_see_more !== "false" ? "hover:shadow-lg cursor-pointer" : "cursor-default"} ${speakersSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              >
                <div className="w-full aspect-[4/3] bg-cream-dark overflow-hidden">
                  {speaker.photo ? (
                    <img src={speaker.photo} alt={speaker.name} className="w-full h-full object-cover object-top block" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-7 h-7 text-muted-light/30" />
                    </div>
                  )}
                </div>
                <div className="px-4 pt-3.5 pb-3">
                  <p className="font-serif text-dark text-[14px] font-bold leading-snug min-h-[1.3em]">
                    {speaker.name}
                  </p>
                  <p className="font-serif text-dark/60 text-[12px] mt-0.5 min-h-[1.2em]">
                    {speaker.nameCn || "\u00A0"}
                  </p>
                  <p className="font-inter text-muted text-[11px] mt-1.5 line-clamp-1">
                    {(lang === "en" ? (speaker.affiliation || speaker.affiliationZh) : (speaker.affiliationZh || speaker.affiliation)) || "\u00A0"}
                  </p>
                  <p className="font-inter text-muted-light text-[11px] mt-0.5 line-clamp-1">
                    {(lang === "en" ? (speaker.title || speaker.titleZh) : (speaker.titleZh || speaker.title)) || "\u00A0"}
                  </p>
                  {settings.speakers_see_more !== "false" && (
                    <span className="inline-flex items-center gap-1 mt-2 font-inter text-[11px] text-gold font-medium group-hover:text-gold-light transition-colors">
                      {lang === "en" ? "More" : "查看更多"} <span className="text-[9px]">→</span>
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>}

      {/* ═══ Sticky Day Tabs ═══ */}
      <StickyDayTabs dayTabs={dayTabs} activeDay={activeDay} setActiveDay={setActiveDay} currentDay={currentDay} />

      {/* ═══ Speaker Modal ═══ */}
      <SpeakerModal
        speaker={selectedSpeaker}
        onClose={() => setSelectedSpeaker(null)}
        lang={lang}
      />

      {/* ═══ Footer ═══ */}
      <Footer slug={slug} lang={lang} siteName={siteName} copyright={settings.copyright} />

      {/* ═══ Floating Register + Language Toggle ═══ */}
      <FloatingRegister
        lang={lang}
        onToggleLang={() => setLang(lang === "en" ? "zh" : "en")}
        showLangToggle={showLangToggle}
        googleFormUrl={settings.registration_google_form_url}
      />
    </>
  );
}

/* ─── Venue Section (with scroll animations) ─── */
function VenueSection({ venues, lang }: { venues: any[]; lang: "zh" | "en" }) {
  const header = useScrollReveal<HTMLDivElement>();

  if (venues.length === 0) return null;

  return (
    <section className="bg-[#FAF8F5] relative overflow-hidden min-h-[calc(100vh-64px)]" id="venue">
      {/* ── Top decorative wave ── */}
      <div className="w-full h-[80px] relative overflow-hidden bg-white">
        <svg className="w-full h-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,0 C360,60 720,20 1080,70 C1260,90 1380,50 1440,60 L1440,80 L0,80 Z" fill="#FAF8F5" />
        </svg>
      </div>

      {/* Header */}
      <div
        ref={header.ref}
        className={`flex flex-col items-center w-full pt-6 pb-10 gap-3 px-6 md:px-20 transition-all duration-700 ${header.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <p className="font-inter text-gold text-[16px] font-semibold tracking-[0.25em] uppercase leading-4">
          {lang === "en" ? "VENUE" : "場地介紹"}
        </p>
        <h2 className="font-serif text-dark text-[32px] md:text-[40px] lg:text-[48px] font-bold leading-tight">
          {lang === "en" ? "Event Venues" : "活動地點"}
        </h2>
        <div className="flex items-center gap-2.5 mt-1">
          <div className={`h-px bg-gold/40 transition-all duration-700 delay-300 ${header.isVisible ? "w-10" : "w-0"}`} />
          <div className={`w-[5px] h-[5px] rounded-full bg-gold transition-all duration-500 delay-500 ${header.isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
          <div className={`h-px bg-gold/40 transition-all duration-700 delay-300 ${header.isVisible ? "w-10" : "w-0"}`} />
        </div>
      </div>

      {/* Dynamic venue locations */}
      {venues.map((venue, idx) => (
        <VenueLocation key={venue.id || idx} venue={venue} index={idx} lang={lang} />
      ))}

      {/* ── Bottom decorative wave ── */}
      <div className="w-full h-[100px] relative overflow-hidden bg-cream">
        <svg className="w-full h-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,80 C360,20 720,60 1080,10 C1260,-10 1380,30 1440,20 L1440,0 L0,0 Z" fill="#FAF8F5" />
        </svg>
      </div>
    </section>
  );
}

/* ─── Individual Venue Location (alternating layout) ─── */
function VenueLocation({ venue, index, lang }: { venue: any; index: number; lang: "zh" | "en" }) {
  const loc = useScrollReveal<HTMLDivElement>();
  const isImageLeft = index % 2 === 0; // even index = image left, odd = image right
  const number = String(index + 1).padStart(2, "0");
  const title = lang === "zh" ? (venue.nameZh || venue.name) : venue.name;
  const bgImage = venue.image || "/img/soch.webp";

  const overlayGradients = [
    "linear-gradient(135deg, rgba(61,58,54,0.6) 0%, rgba(90,85,75,0.4) 50%, rgba(155,148,136,0.3) 100%)",
    "linear-gradient(225deg, rgba(26,50,40,0.5) 0%, rgba(61,90,62,0.4) 50%, rgba(100,140,100,0.3) 100%)",
    "linear-gradient(135deg, rgba(90,74,42,0.5) 0%, rgba(155,123,47,0.3) 50%, rgba(200,180,100,0.2) 100%)",
  ];
  const overlay = overlayGradients[index % overlayGradients.length];

  const decorShapes = [
    // circles for even (image-left)
    <>
      <div className={`absolute top-[60px] left-[40px] w-[200px] h-[200px] rounded-full border border-white/10 transition-all duration-1000 delay-300 ${loc.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
      <div className={`absolute top-[100px] left-[80px] w-[120px] h-[120px] rounded-full border border-white/10 transition-all duration-1000 delay-500 ${loc.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
    </>,
    // rounded rect for odd (image-right)
    <>
      <div className={`absolute bottom-[60px] right-[60px] w-[160px] h-[160px] rounded-[20px] border border-white/10 rotate-12 transition-all duration-1000 delay-400 ${loc.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
    </>,
    // mixed for third
    <>
      <div className={`absolute top-[50px] left-[50px] w-[180px] h-[140px] rounded-[20px] border border-white/10 transition-all duration-1000 delay-300 ${loc.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
      <div className={`absolute top-[90px] left-[90px] w-[100px] h-[100px] rounded-full border border-white/10 transition-all duration-1000 delay-500 ${loc.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
    </>,
  ];

  const imagePanel = (
    <div className="relative w-full md:w-1/2 h-[200px] md:h-full overflow-hidden">
      <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ${loc.isVisible ? "scale-100" : "scale-110"}`} style={{ backgroundImage: `url('${bgImage}')` }} />
      <div className="absolute inset-0" style={{ backgroundImage: overlay }} />
      {decorShapes[index % decorShapes.length]}
    </div>
  );

  const slideDir = isImageLeft ? "translate-x-8" : "-translate-x-8";
  const textPanel = (
    <div className={`w-full md:w-1/2 flex flex-col justify-center px-6 md:px-10 lg:px-16 py-8 md:py-0 gap-2 md:gap-3 bg-[#FAF8F5] ${!isImageLeft ? "order-2 md:order-1" : ""} transition-all duration-700 delay-200 ${loc.isVisible ? "opacity-100 translate-x-0" : `opacity-0 ${slideDir}`}`}>
      <span className="font-inter text-gold/20 text-[48px] md:text-[72px] font-extralight leading-none">{number}</span>
      <h3 className="font-serif text-dark text-[22px] md:text-[28px] lg:text-[32px] font-bold leading-tight">
        {title}
      </h3>
      {(venue.description || venue.descriptionEn) && (
        <p className="font-sans text-[#5A554B] text-[14px] font-light leading-[26px] max-w-[460px]">
          {lang === "en" ? (venue.descriptionEn || venue.description) : venue.description}
        </p>
      )}
      {(venue.address || venue.mapUrl) && (
        <a
          href={venue.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(venue.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center mt-2 gap-1.5 group px-3 py-1.5 rounded-lg border border-gold/20 hover:border-gold/40 hover:bg-gold/5 transition-all"
        >
          <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
          <span className="font-sans text-gold text-[13px] group-hover:underline flex-1">{venue.address || (lang === "en" ? (venue.name || venue.nameZh) : (venue.nameZh || venue.name))}</span>
          <span className="text-[10px] text-gold/50 font-inter shrink-0">↗</span>
        </a>
      )}
    </div>
  );

  return (
    <div
      ref={loc.ref}
      className={`w-full h-auto md:h-[320px] lg:h-[360px] flex flex-col md:flex-row transition-all duration-700 ${loc.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
    >
      {isImageLeft ? (
        <>{imagePanel}{textPanel}</>
      ) : (
        <>{textPanel}<div className="order-1 md:order-2 relative w-full md:w-1/2 h-[200px] md:h-full overflow-hidden">
          <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ${loc.isVisible ? "scale-100" : "scale-110"}`} style={{ backgroundImage: `url('${bgImage}')` }} />
          <div className="absolute inset-0" style={{ backgroundImage: overlay }} />
        </div></>
      )}
    </div>
  );
}

/* ─── Original Day Tabs (in header) ─── */
function DayTabsOriginal({ dayTabs, activeDay, setActiveDay }: {
  dayTabs: { label: string }[];
  activeDay: number;
  setActiveDay: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 md:gap-2 mt-4 md:mt-0" id="day-tabs-original">
      {dayTabs.map((tab, i) => (
        <button
          key={i}
          onClick={() => setActiveDay(i)}
          className={`font-inter text-[13px] md:text-[16px] px-3 md:px-5 py-2 md:py-2.5 rounded-full border transition-colors whitespace-nowrap ${
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
      <div className="flex justify-start md:justify-center gap-1.5 py-2 px-4 md:px-6 overflow-x-auto scrollbar-hide">
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
            className={`font-inter text-[11px] md:text-[12px] px-2.5 md:px-3.5 py-1.5 rounded-full border transition-colors flex flex-col items-center gap-0.5 shrink-0 ${
              activeDay === i
                ? "bg-dark text-cream border-dark"
                : "bg-transparent text-muted border-border hover:border-dark hover:text-dark"
            }`}
          >
            <span className="font-medium whitespace-nowrap">{tab.label}</span>
            <span className={`text-[9px] md:text-[10px] font-bold whitespace-nowrap ${activeDay === i ? "text-gold" : "text-gold/60"}`}>{tab.theme}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
