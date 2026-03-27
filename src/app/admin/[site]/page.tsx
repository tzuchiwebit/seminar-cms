"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {

  Users,
  Calendar,
  FileText,
  Image,
  MapPin,
  ClipboardList,
  Settings,
  ChevronLeft,
  Search,
  Plus,
  Pencil,
  Trash2,
  Clock,
  AlignLeft,
  Palette,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";

/* ═══════════════════════════════════════════
   NAV ITEMS
   ═══════════════════════════════════════════ */
type Tab = "description" | "programme" | "exhibition" | "venues" | "speakers" | "papers" | "registrations" | "styles" | "settings";

const navItems: { label: string; id: Tab; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "活動簡介", id: "description", icon: AlignLeft },
  { label: "議程", id: "programme", icon: Calendar },
  { label: "展覽", id: "exhibition", icon: Image },
  { label: "場地", id: "venues", icon: MapPin },
  { label: "講者", id: "speakers", icon: Users },
  { label: "論文", id: "papers", icon: FileText },
  { label: "報名", id: "registrations", icon: ClipboardList },
  { label: "樣式設定", id: "styles", icon: Palette },
  { label: "設定", id: "settings", icon: Settings },
];

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const speakersData = [
  { id: 1, name: "汪悅進", affiliation: "Harvard University", session: "Day 03", status: "Confirmed" },
  { id: 2, name: "釋德懋", affiliation: "靜思精舍", session: "Day 01", status: "Confirmed" },
  { id: 3, name: "林建德", affiliation: "慈濟大學", session: "Day 01", status: "Confirmed" },
  { id: 4, name: "何日生", affiliation: "慈濟基金會", session: "Day 02", status: "Pending" },
  { id: 5, name: "蔡耀明", affiliation: "國立臺灣大學", session: "Day 03", status: "Draft" },
  { id: 6, name: "顏博文", affiliation: "慈濟基金會", session: "Day 02", status: "Confirmed" },
  { id: 7, name: "Mark C. Elliott", affiliation: "Harvard University", session: "Day 02", status: "Confirmed" },
  { id: 8, name: "盧蕙馨", affiliation: "慈濟大學", session: "Day 01", status: "Confirmed" },
];


const programmeData = [
  {
    day: "Day 01 · 5/7",
    theme: "應用佛教與菩薩道",
    sessions: [
      { time: "8:30 AM", duration: "50 min", type: "opening", badge: "開幕典禮", title: "開幕典禮 Opening Ceremony", speakers: "Harvard Representative, 靜思精舍代表, CAMLab Representative" },
      { time: "9:30 AM", duration: "30 min", type: "keynote", badge: "專題演講", title: "菩薩道的當代意義與社會實踐", speakers: "何日生" },
      { time: "10:20 AM", duration: "70 min", type: "paper", badge: "論文發表一", title: "Paper Session I · 3 papers", speakers: "林建德, 盧蕙馨, 蔡耀明" },
      { time: "4:40 PM", duration: "110 min", type: "roundtable", badge: "圓桌論壇", title: "佛教在全球化時代的角色與責任", speakers: "汪悅進, 何日生, 林建德, 盧蕙馨" },
      { time: "7:00 PM", duration: "", type: "dinner", badge: "晚宴", title: "晚宴 · Harvard Faculty Club", speakers: "" },
    ],
  },
  {
    day: "Day 02 · 5/8",
    theme: "證嚴上人思想與實踐",
    sessions: [
      { time: "9:00 AM", duration: "30 min", type: "keynote", badge: "專題演講", title: "證嚴上人的慈悲哲學", speakers: "釋德懋" },
      { time: "10:00 AM", duration: "70 min", type: "paper", badge: "論文發表二", title: "Paper Session II · 3 papers", speakers: "" },
      { time: "1:30 PM", duration: "70 min", type: "paper", badge: "論文發表三", title: "Paper Session III · 3 papers", speakers: "" },
      { time: "3:30 PM", duration: "110 min", type: "roundtable", badge: "圓桌論壇", title: "慈濟精神與現代社會", speakers: "" },
      { time: "7:00 PM", duration: "", type: "dinner", badge: "展覽開幕", title: "明心展覽開幕 · Harvard Art Museum", speakers: "" },
    ],
  },
  {
    day: "Day 03 · 5/9",
    theme: "佛教藝術",
    sessions: [
      { time: "9:00 AM", duration: "30 min", type: "keynote", badge: "專題演講", title: "佛教藝術的當代轉譯", speakers: "汪悅進" },
      { time: "10:00 AM", duration: "70 min", type: "paper", badge: "論文發表四", title: "Paper Session IV · 3 papers", speakers: "" },
      { time: "1:30 PM", duration: "110 min", type: "roundtable", badge: "圓桌論壇", title: "藝術、科技與佛教的未來", speakers: "" },
      { time: "3:00 PM", duration: "60 min", type: "closing", badge: "閉幕典禮", title: "閉幕典禮 Closing Ceremony", speakers: "" },
    ],
  },
];

const papersData = [
  { id: 1, title: "〈人間佛教的菩薩行與社會參與〉", author: "林建德", affiliation: "慈濟大學", session: "Paper Session I", status: "Accepted" },
  { id: 2, title: "〈證嚴法師思想中的利他精神〉", author: "盧蕙馨", affiliation: "慈濟大學", session: "Paper Session I", status: "Accepted" },
  { id: 3, title: "〈當代佛教教育的挑戰與展望〉", author: "蔡耀明", affiliation: "國立臺灣大學", session: "Paper Session I", status: "Accepted" },
  { id: 4, title: "〈明心：沉浸式佛教藝術展覽的策展理念與實踐〉", author: "汪悅進", affiliation: "Harvard University", session: "Paper Session V", status: "Under Review" },
  { id: 5, title: "〈從視覺到心覺：佛教藝術的觀看與修行意涵〉", author: "汪悅進", affiliation: "Harvard University", session: "Paper Session V", status: "Pending" },
];

const venuesData = [
  { name: "Student Organization Center at Hilles (SOCH)", nameZh: "哈佛大學學生社團中心", type: "Main Venue", sessions: "All daytime sessions", capacity: 300 },
  { name: "Harvard Faculty Club", nameZh: "哈佛教職員俱樂部", type: "Evening Events", sessions: "Day 1 & 2 dinners", capacity: 100 },
  { name: "Adolphus Busch Hall, Harvard Art Museum", nameZh: "哈佛藝術博物館", type: "Exhibition & Gala", sessions: "明心展覽, Day 2 evening", capacity: 200 },
];

const registrationsData = [
  { id: 1, name: "Dr. Sarah Chen", email: "sarah.chen@stanford.edu", org: "Stanford University", status: "Confirmed", date: "2 hours ago" },
  { id: 2, name: "王大明", email: "wang@ntu.edu.tw", org: "國立臺灣大學", status: "Confirmed", date: "5 hours ago" },
  { id: 3, name: "Prof. James Liu", email: "jliu@princeton.edu", org: "Princeton University", status: "Pending", date: "Yesterday" },
  { id: 4, name: "陳美玲", email: "chen@tzuchi.edu.tw", org: "慈濟大學", status: "Confirmed", date: "2 days ago" },
  { id: 5, name: "Dr. Yuki Tanaka", email: "tanaka@todai.ac.jp", org: "University of Tokyo", status: "Pending", date: "3 days ago" },
];

/* ═══════════════════════════════════════════
   SECTION VISIBILITY
   ═══════════════════════════════════════════ */
type SectionKey = "description" | "programme" | "exhibition" | "venues" | "speakers" | "papers" | "registrations";

const sectionLabels: Record<SectionKey, string> = {
  description: "活動簡介",
  programme: "議程",
  exhibition: "展覽",
  venues: "場地",
  speakers: "講者",
  papers: "論文",
  registrations: "報名",
};

/* ═══════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════ */
function SectionToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-2 group">
      <div className={`w-9 h-5 rounded-full relative transition-colors ${enabled ? "bg-green" : "bg-muted/30"}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? "right-0.5" : "left-0.5"}`} />
      </div>
      <span className={`text-xs font-medium ${enabled ? "text-green" : "text-muted"}`}>
        {enabled ? "已發布" : "隱藏中"}
      </span>
    </button>
  );
}
const statusLabels: Record<string, string> = {
  Confirmed: "已確認",
  Pending: "待確認",
  Draft: "草稿",
  Accepted: "已接受",
  "Under Review": "審核中",
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Confirmed: "bg-green/10 text-green",
    Pending: "bg-gold/10 text-gold",
    Draft: "bg-muted/10 text-muted",
    Accepted: "bg-green/10 text-green",
    "Under Review": "bg-blue-100 text-blue-600",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-muted/10 text-muted"}`}>
      {statusLabels[status] || status}
    </span>
  );
}

function SessionBadge({ type, label }: { type: string; label: string }) {
  const colors: Record<string, string> = {
    opening: "bg-gold text-white",
    keynote: "bg-gold text-white",
    paper: "bg-green text-white",
    roundtable: "bg-gold text-white",
    dinner: "bg-muted text-white",
    closing: "bg-dark text-white",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[type] || "bg-muted text-white"}`}>
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════
   TAB PANELS
   ═══════════════════════════════════════════ */


function DescriptionPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark">活動簡介</h2>
        <button className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">儲存變更</button>
      </div>
      <div className="bg-white rounded-xl border border-border p-6 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">標題（中文）</label>
            <input type="text" defaultValue="一場探索佛教未來的學術盛會" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1">標題（英文）</label>
            <input type="text" defaultValue="An Academic Symposium Exploring the Future of Buddhism" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">說明（中文）</label>
          <textarea rows={5} defaultValue="「全球共善學思會」匯聚國際佛學研究者、宗教實踐者與人文學者，以三日的學術發表、圓桌論壇與沉浸式藝術體驗，深入探討應用佛教、菩薩道精神與佛教藝術的當代轉譯。本次學思會由慈濟基金會與哈佛大學 CAMLab 共同主辦，期盼在學術對話中，為佛教的未來開展新的視野與可能。" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">說明（英文）</label>
          <textarea rows={5} defaultValue="The Tzu Chi Global Symposium brings together international Buddhist scholars, religious practitioners, and humanities researchers for three days of academic presentations, roundtable discussions, and immersive art experiences. Co-hosted by the Tzu Chi Foundation and Harvard University's CAMLab, this symposium explores applied Buddhism, the Bodhisattva path, and the contemporary translation of Buddhist art — opening new horizons for the future of Buddhism through scholarly dialogue." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
      </div>

      {/* Highlights */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-dark">亮點</h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
            <Plus className="w-4 h-4" /> 新增亮點
          </button>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: "19 篇學術論文發表", labelEn: "19 Academic Papers" },
            { label: "3 場圓桌論壇對話", labelEn: "3 Roundtable Discussions" },
            { label: "跨宗派跨領域交流", labelEn: "Cross-tradition Dialogue" },
            { label: "來自全球的學者參與", labelEn: "Global Scholar Participation" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-dark">{item.label}</p>
                <p className="text-xs text-muted mt-0.5">{item.labelEn}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 text-muted hover:text-gold rounded-md hover:bg-gold/10"><Pencil className="w-4 h-4" /></button>
                <button className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpeakersPanel() {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? speakersData : speakersData.filter((s) => s.status === filter);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 border-b border-border">
          {["All", "Confirmed", "Pending", "Draft"].map((f) => {
            const filterLabels: Record<string, string> = { All: "全部", Confirmed: "已確認", Pending: "待確認", Draft: "草稿" };
            return (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${filter === f ? "border-gold text-gold" : "border-transparent text-muted hover:text-dark"}`}>
              {filterLabels[f]}
            </button>
          );
          })}
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
          <Plus className="w-4 h-4" /> 新增講者
        </button>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted uppercase tracking-wider bg-cream/50">
              <th className="px-6 py-3 font-medium">姓名</th>
              <th className="px-6 py-3 font-medium">所屬單位</th>
              <th className="px-6 py-3 font-medium">場次</th>
              <th className="px-6 py-3 font-medium">狀態</th>
              <th className="px-6 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-cream/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cream-dark flex items-center justify-center text-sm text-muted font-medium">{s.name.charAt(0)}</div>
                    <span className="text-sm font-medium text-dark">{s.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted">{s.affiliation}</td>
                <td className="px-6 py-4 text-sm text-muted">{s.session}</td>
                <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 text-muted hover:text-gold rounded-md hover:bg-gold/10"><Pencil className="w-4 h-4" /></button>
                    <button className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ProgrammePanel() {
  const [activeDay, setActiveDay] = useState(0);
  const day = programmeData[activeDay];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {programmeData.map((d, i) => (
            <button key={i} onClick={() => setActiveDay(i)} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeDay === i ? "bg-dark text-cream" : "bg-white border border-border text-muted hover:text-dark"}`}>
              {d.day}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
          <Plus className="w-4 h-4" /> 新增場次
        </button>
      </div>

      <div className="mb-4 p-4 bg-cream-dark rounded-lg">
        <p className="text-sm text-muted font-medium">{day.theme}</p>
      </div>

      <div className="space-y-3">
        {day.sessions.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-5 flex items-start justify-between">
            <div className="flex gap-5">
              <div className="text-right w-20 shrink-0">
                <p className="text-lg font-semibold text-dark">{s.time}</p>
                {s.duration && <p className="text-xs text-muted">{s.duration}</p>}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SessionBadge type={s.type} label={s.badge} />
                </div>
                <p className="text-sm font-medium text-dark">{s.title}</p>
                {s.speakers && <p className="text-xs text-muted mt-1">{s.speakers}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 text-muted hover:text-gold rounded-md hover:bg-gold/10"><Pencil className="w-4 h-4" /></button>
              <button className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PapersPanel() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-dark">所有論文</h2>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
          <Plus className="w-4 h-4" /> 新增論文
        </button>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted uppercase tracking-wider bg-cream/50">
              <th className="px-6 py-3 font-medium">論文標題</th>
              <th className="px-6 py-3 font-medium">作者</th>
              <th className="px-6 py-3 font-medium">場次</th>
              <th className="px-6 py-3 font-medium">狀態</th>
              <th className="px-6 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {papersData.map((p) => (
              <tr key={p.id} className="hover:bg-cream/30">
                <td className="px-6 py-4 text-sm font-medium text-dark max-w-[300px] truncate">{p.title}</td>
                <td className="px-6 py-4">
                  <div><span className="text-sm text-dark">{p.author}</span><br /><span className="text-xs text-muted">{p.affiliation}</span></div>
                </td>
                <td className="px-6 py-4 text-sm text-muted">{p.session}</td>
                <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 text-muted hover:text-gold rounded-md hover:bg-gold/10"><Pencil className="w-4 h-4" /></button>
                    <button className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ExhibitionPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark">展覽管理</h2>
        <button className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">儲存變更</button>
      </div>
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark mb-1">展覽名稱（中文）</label>
          <input type="text" defaultValue="明心" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">展覽名稱（英文）</label>
          <input type="text" defaultValue="Journey to Enlightenment" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">展覽說明</label>
          <textarea rows={4} defaultValue="由哈佛大學CAMLab策劃，結合沉浸式藝術體驗，引領觀者走入佛教藝術與靜思法脈的精神之旅。" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">開始日期</label>
            <input type="date" defaultValue="2026-05-06" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1">結束日期</label>
            <input type="date" defaultValue="2026-05-09" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">展覽場地</label>
          <input type="text" defaultValue="Adolphus Busch Hall, Harvard Art Museum" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
      </div>
    </div>
  );
}

function VenuesPanel() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-dark">場地管理</h2>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
          <Plus className="w-4 h-4" /> 新增場地
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {venuesData.map((v) => (
          <div key={v.name} className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span className="text-xs text-gold uppercase tracking-wider font-medium">{v.type}</span>
              </div>
              <button className="p-1.5 text-muted hover:text-gold rounded-md hover:bg-gold/10"><Pencil className="w-4 h-4" /></button>
            </div>
            <p className="font-medium text-dark text-sm mb-1">{v.name}</p>
            <p className="text-xs text-muted mb-3">{v.nameZh}</p>
            <div className="flex items-center gap-4 text-xs text-muted-light">
              <span>容量：{v.capacity} 人</span>
              <span>{v.sessions}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function RegistrationsPanel() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-dark">報名管理</h2>
        <button className="px-4 py-2 bg-white border border-border text-sm text-dark rounded-lg hover:bg-cream transition-colors">匯出 CSV</button>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted uppercase tracking-wider bg-cream/50">
              <th className="px-6 py-3 font-medium">姓名</th>
              <th className="px-6 py-3 font-medium">電子信箱</th>
              <th className="px-6 py-3 font-medium">所屬機構</th>
              <th className="px-6 py-3 font-medium">狀態</th>
              <th className="px-6 py-3 font-medium">報名時間</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {registrationsData.map((r) => (
              <tr key={r.id} className="hover:bg-cream/30">
                <td className="px-6 py-4 text-sm font-medium text-dark">{r.name}</td>
                <td className="px-6 py-4 text-sm text-muted">{r.email}</td>
                <td className="px-6 py-4 text-sm text-muted">{r.org}</td>
                <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                <td className="px-6 py-4 text-sm text-muted">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   STYLES PANEL
   ═══════════════════════════════════════════ */

interface ThemeColor {
  label: string;
  hex: string;
}

interface TypographyItem {
  key: string;
  label: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
}

interface TypographyGroup {
  groupLabel: string;
  items: TypographyItem[];
}

const defaultColors: ThemeColor[] = [
  { label: "Cream", hex: "#F5F1EB" },
  { label: "Dark", hex: "#1A1816" },
  { label: "Gold", hex: "#9B7B2F" },
  { label: "Green", hex: "#3D5A3E" },
];

const defaultTypography: TypographyGroup[] = [
  {
    groupLabel: "標題",
    items: [
      { key: "h1", label: "H1", fontFamily: "Noto Serif TC", fontSize: 48, fontWeight: 700, lineHeight: 1.2 },
      { key: "h2", label: "H2", fontFamily: "Noto Serif TC", fontSize: 36, fontWeight: 700, lineHeight: 1.3 },
      { key: "h3", label: "H3", fontFamily: "Noto Serif TC", fontSize: 24, fontWeight: 500, lineHeight: 1.4 },
    ],
  },
  {
    groupLabel: "內文",
    items: [
      { key: "body", label: "Body", fontFamily: "Noto Sans TC", fontSize: 16, fontWeight: 400, lineHeight: 1.6 },
      { key: "body-lg", label: "Body Large", fontFamily: "Noto Sans TC", fontSize: 18, fontWeight: 400, lineHeight: 1.6 },
    ],
  },
  {
    groupLabel: "小字",
    items: [
      { key: "small", label: "Small", fontFamily: "Noto Sans TC", fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
      { key: "caption", label: "Caption", fontFamily: "Inter", fontSize: 12, fontWeight: 400, lineHeight: 1.4 },
    ],
  },
];

const fontFamilyOptions = ["Noto Sans TC", "Noto Serif TC", "Inter"];
const fontWeightOptions = [400, 500, 700, 900];

function StylesPanel({ siteSlug }: { siteSlug: string }) {
  const [colors, setColors] = useState<ThemeColor[]>(defaultColors);
  const [typography, setTypography] = useState<TypographyGroup[]>(defaultTypography);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "標題": true, "內文": false, "小字": false });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [siteId, setSiteId] = useState<number | null>(null);

  // Resolve slug to site ID, then fetch settings
  useEffect(() => {
    async function load() {
      try {
        // Get all sites and find by slug
        const sitesRes = await fetch("/api/sites");
        if (!sitesRes.ok) return;
        const sites = await sitesRes.json();
        const site = sites.find((s: { slug: string }) => s.slug === siteSlug);
        if (!site) return;
        setSiteId(site.id);

        const res = await fetch(`/api/sites/${site.id}/settings`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.theme_colors) {
          try {
            const parsed = JSON.parse(data.theme_colors);
            if (Array.isArray(parsed) && parsed.length > 0) setColors(parsed);
          } catch { /* use defaults */ }
        }

        if (data.theme_typography) {
          try {
            const parsed = JSON.parse(data.theme_typography);
            if (Array.isArray(parsed) && parsed.length > 0) setTypography(parsed);
          } catch { /* use defaults */ }
        }
      } catch { /* use defaults */ }
      setLoaded(true);
    }
    load();
  }, [siteSlug]);

  const handleSave = useCallback(async () => {
    if (!siteId) return;
    setSaving(true);
    try {
      await fetch(`/api/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "theme_colors", value: JSON.stringify(colors) }),
      });
      await fetch(`/api/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "theme_typography", value: JSON.stringify(typography) }),
      });
    } catch (e) {
      console.error("Failed to save styles", e);
    }
    setSaving(false);
  }, [siteId, colors, typography]);

  const addColor = () => {
    setColors([...colors, { label: "", hex: "#000000" }]);
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const updateColor = (index: number, field: "label" | "hex", value: string) => {
    const updated = [...colors];
    updated[index] = { ...updated[index], [field]: value };
    setColors(updated);
  };

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  };

  const updateTypographyItem = (groupIndex: number, itemIndex: number, field: keyof TypographyItem, value: string | number) => {
    const updated = [...typography];
    const group = { ...updated[groupIndex] };
    const items = [...group.items];
    items[itemIndex] = { ...items[itemIndex], [field]: value };
    group.items = items;
    updated[groupIndex] = group;
    setTypography(updated);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-muted">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Save */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark">樣式設定</h2>
        <button
          onClick={handleSave}
          disabled={saving || !siteId}
          className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {saving ? "儲存中..." : "儲存變更"}
        </button>
      </div>

      {/* ── Colors Section ── */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-dark">顏色設定</h3>
          <button
            onClick={addColor}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors"
          >
            <Plus className="w-4 h-4" /> 新增顏色
          </button>
        </div>
        <div className="p-6 space-y-3">
          {colors.map((color, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="text"
                value={color.label}
                onChange={(e) => updateColor(index, "label", e.target.value)}
                placeholder="名稱"
                className="w-32 px-3 py-2 border border-border rounded-lg text-sm"
              />
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="color"
                  value={color.hex}
                  onChange={(e) => updateColor(index, "hex", e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={color.hex}
                  onChange={(e) => updateColor(index, "hex", e.target.value)}
                  placeholder="#000000"
                  className="w-28 px-3 py-2 border border-border rounded-lg text-sm font-mono"
                />
                <div
                  className="w-10 h-10 rounded-lg border border-border shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
              </div>
              <button
                onClick={() => removeColor(index)}
                className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {colors.length === 0 && (
            <p className="text-sm text-muted text-center py-4">尚未設定顏色</p>
          )}
        </div>
      </div>

      {/* ── Typography Section ── */}
      <div className="bg-white rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-dark">文字樣式</h3>
        </div>
        <div className="divide-y divide-border">
          {typography.map((group, gIndex) => (
            <div key={group.groupLabel}>
              {/* Group header - collapsible */}
              <button
                onClick={() => toggleGroup(group.groupLabel)}
                className="w-full flex items-center justify-between px-6 py-3 hover:bg-cream/30 transition-colors"
              >
                <span className="text-sm font-medium text-dark">{group.groupLabel}</span>
                {expandedGroups[group.groupLabel] ? (
                  <ChevronDown className="w-4 h-4 text-muted" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted" />
                )}
              </button>

              {/* Group items */}
              {expandedGroups[group.groupLabel] && (
                <div className="px-6 pb-4 space-y-4">
                  {group.items.map((item, iIndex) => (
                    <div key={item.key} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-muted uppercase tracking-wider">{item.label}</span>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        {/* Font family */}
                        <div>
                          <label className="block text-xs text-muted mb-1">Font Family</label>
                          <select
                            value={item.fontFamily}
                            onChange={(e) => updateTypographyItem(gIndex, iIndex, "fontFamily", e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
                          >
                            {fontFamilyOptions.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>

                        {/* Font size */}
                        <div>
                          <label className="block text-xs text-muted mb-1">Size (px)</label>
                          <input
                            type="number"
                            value={item.fontSize}
                            onChange={(e) => updateTypographyItem(gIndex, iIndex, "fontSize", parseInt(e.target.value) || 0)}
                            min={8}
                            max={120}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                          />
                        </div>

                        {/* Font weight */}
                        <div>
                          <label className="block text-xs text-muted mb-1">Weight</label>
                          <select
                            value={item.fontWeight}
                            onChange={(e) => updateTypographyItem(gIndex, iIndex, "fontWeight", parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
                          >
                            {fontWeightOptions.map((w) => (
                              <option key={w} value={w}>{w}</option>
                            ))}
                          </select>
                        </div>

                        {/* Line height */}
                        <div>
                          <label className="block text-xs text-muted mb-1">Line Height</label>
                          <input
                            type="number"
                            value={item.lineHeight}
                            onChange={(e) => updateTypographyItem(gIndex, iIndex, "lineHeight", parseFloat(e.target.value) || 1)}
                            min={0.8}
                            max={3}
                            step={0.1}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      {/* Live preview */}
                      <div className="mt-3 p-3 bg-cream rounded-lg">
                        <p
                          style={{
                            fontFamily: item.fontFamily,
                            fontSize: `${Math.min(item.fontSize, 48)}px`,
                            fontWeight: item.fontWeight,
                            lineHeight: item.lineHeight,
                          }}
                          className="text-dark"
                        >
                          文字預覽 Abc
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dark">網站設定</h2>
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark mb-1">網站名稱</label>
          <input type="text" defaultValue="全球共善學思會" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">網域</label>
          <input type="text" defaultValue="symposium.tzuchi.org" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">活動開始日期</label>
            <input type="date" defaultValue="2026-05-07" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1">活動結束日期</label>
            <input type="date" defaultValue="2026-05-09" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-border">
          <div>
            <p className="text-sm font-medium text-dark">開放報名</p>
            <p className="text-xs text-muted">允許公開報名</p>
          </div>
          <div className="w-11 h-6 bg-green rounded-full relative cursor-pointer">
            <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow" />
          </div>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-border">
          <div>
            <p className="text-sm font-medium text-dark">網站狀態</p>
            <p className="text-xs text-muted">已發布的網站將對外公開</p>
          </div>
          <StatusBadge status="Confirmed" />
        </div>
      </div>
      <button className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">儲存變更</button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */

export default function SiteDashboard() {
  const params = useParams();
  const siteSlug = params.site as string;
  const [activeTab, setActiveTab] = useState<Tab>("description");
  const [sectionVisibility, setSectionVisibility] = useState<Record<SectionKey, boolean>>({
    description: true,
    programme: true,
    exhibition: true,
    venues: true,
    speakers: true,
    papers: true,
    registrations: true,
  });

  const toggleSection = (key: SectionKey) => {
    setSectionVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const tabTitles: Record<Tab, string> = {
    description: "活動簡介",
    programme: "議程管理",
    exhibition: "展覽管理",
    venues: "場地管理",
    speakers: "講者管理",
    papers: "論文管理",
    registrations: "報名管理",
    styles: "樣式設定",
    settings: "網站設定",
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className="w-[260px] bg-sidebar fixed left-0 top-0 bottom-0 flex flex-col z-50">
        <div className="px-5 pt-5 pb-3">
          <Link href="/admin" className="flex items-center gap-1.5 text-white/50 text-sm hover:text-white/80 transition-colors">
            <ChevronLeft className="w-4 h-4" /> 所有網站
          </Link>
        </div>
        <div className="px-5 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-white font-serif text-lg shrink-0">善</div>
            <div className="min-w-0">
              <div className="text-white font-serif text-sm font-medium truncate">全球共善學思會</div>
              <div className="text-white/40 text-xs truncate">symposium.tzuchi.org</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              const isSection = item.id in sectionVisibility;
              const isVisible = isSection ? sectionVisibility[item.id as SectionKey] : true;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors relative ${active ? "text-gold bg-white/5" : "text-white/60 hover:text-white/90 hover:bg-white/5"}`}
                  >
                    {active && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold rounded-r" />}
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isSection && (
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isVisible ? "bg-green" : "bg-muted/40"}`} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/80 flex items-center justify-center text-white text-sm font-medium">A</div>
            <div className="min-w-0">
              <div className="text-white text-sm truncate">Admin User</div>
              <div className="text-white/40 text-xs truncate">admin@tzuchi.org</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-[260px] flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-white">
          <div>
            <h1 className="text-xl font-semibold text-dark">{tabTitles[activeTab]}</h1>
            <p className="text-sm text-muted">全球共善學思會 · May 7–9, 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-cream border border-border rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-muted" />
              <input type="text" placeholder="搜尋..." className="text-sm outline-none bg-transparent w-32" />
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
              <Plus className="w-4 h-4" /> 新增項目
            </button>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-8">
          {/* Section toggle bar */}
          {activeTab !== "settings" && activeTab !== "styles" && (
            <div className="flex items-center justify-between mb-6 px-5 py-3 bg-white rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${sectionVisibility[activeTab as SectionKey] ? "bg-green" : "bg-muted/40"}`} />
                <span className="text-sm text-dark font-medium">
                  此區塊在公開網站{sectionVisibility[activeTab as SectionKey] ? "已顯示" : "已隱藏"}
                </span>
              </div>
              <SectionToggle
                enabled={sectionVisibility[activeTab as SectionKey]}
                onToggle={() => toggleSection(activeTab as SectionKey)}
              />
            </div>
          )}

          {activeTab === "description" && <DescriptionPanel />}
          {activeTab === "programme" && <ProgrammePanel />}
          {activeTab === "exhibition" && <ExhibitionPanel />}
          {activeTab === "venues" && <VenuesPanel />}
          {activeTab === "speakers" && <SpeakersPanel />}
          {activeTab === "papers" && <PapersPanel />}
          {activeTab === "registrations" && <RegistrationsPanel />}
          {activeTab === "styles" && <StylesPanel siteSlug={siteSlug} />}
          {activeTab === "settings" && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}
