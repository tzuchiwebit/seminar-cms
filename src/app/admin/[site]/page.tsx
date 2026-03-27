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
  confirmed: "已確認",
  Pending: "待確認",
  pending: "待確認",
  Draft: "草稿",
  draft: "草稿",
  Accepted: "已接受",
  accepted: "已接受",
  "Under Review": "審核中",
  "under_review": "審核中",
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Confirmed: "bg-green/10 text-green",
    confirmed: "bg-green/10 text-green",
    Pending: "bg-gold/10 text-gold",
    pending: "bg-gold/10 text-gold",
    Draft: "bg-muted/10 text-muted",
    draft: "bg-muted/10 text-muted",
    Accepted: "bg-green/10 text-green",
    accepted: "bg-green/10 text-green",
    "Under Review": "bg-blue-100 text-blue-600",
    "under_review": "bg-blue-100 text-blue-600",
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


function DescriptionPanel({ siteId }: { siteId: number }) {
  const [headlineZh, setHeadlineZh] = useState("");
  const [headlineEn, setHeadlineEn] = useState("");
  const [bodyZh, setBodyZh] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sites/${siteId}/settings`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.description_headline) setHeadlineZh(data.description_headline);
        if (data.description_headline_en) setHeadlineEn(data.description_headline_en);
        if (data.description_body) setBodyZh(data.description_body);
        if (data.description_body_en) setBodyEn(data.description_body_en);
      } catch { /* ignore */ }
      setLoaded(true);
    }
    load();
  }, [siteId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const pairs = [
        { key: "description_headline", value: headlineZh },
        { key: "description_headline_en", value: headlineEn },
        { key: "description_body", value: bodyZh },
        { key: "description_body_en", value: bodyEn },
      ];
      for (const pair of pairs) {
        await fetch(`/api/sites/${siteId}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pair),
        });
      }
    } catch (e) {
      console.error("Failed to save description", e);
    }
    setSaving(false);
  };

  if (!loaded) return <div className="flex items-center justify-center py-20"><div className="text-sm text-muted">載入中...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark">活動簡介</h2>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50">
          {saving ? "儲存中..." : "儲存變更"}
        </button>
      </div>
      <div className="bg-white rounded-xl border border-border p-6 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">標題（中文）</label>
            <input type="text" value={headlineZh} onChange={(e) => setHeadlineZh(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1">標題（英文）</label>
            <input type="text" value={headlineEn} onChange={(e) => setHeadlineEn(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">說明（中文）</label>
          <textarea rows={5} value={bodyZh} onChange={(e) => setBodyZh(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">說明（英文）</label>
          <textarea rows={5} value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
      </div>
    </div>
  );
}

function SpeakersPanel({ siteId }: { siteId: number }) {
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", nameEn: "", affiliation: "", title: "", bio: "", status: "draft" });

  const fetchSpeakers = useCallback(async () => {
    try {
      const res = await fetch(`/api/speakers?siteId=${siteId}`);
      if (!res.ok) return;
      const data = await res.json();
      setSpeakers(data);
    } catch { /* ignore */ }
  }, [siteId]);

  useEffect(() => { fetchSpeakers(); }, [fetchSpeakers]);

  const filtered = filter === "All" ? speakers : speakers.filter((s) => s.status?.toLowerCase() === filter.toLowerCase());

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", nameEn: "", affiliation: "", title: "", bio: "", status: "draft" });
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      name: item.name || "",
      nameEn: item.nameEn || "",
      affiliation: item.affiliation || "",
      title: item.title || "",
      bio: item.bio || "",
      status: item.status || "draft",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await fetch(`/api/speakers/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/speakers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, siteId }),
        });
      }
      setShowForm(false);
      fetchSpeakers();
    } catch (e) {
      console.error("Failed to save speaker", e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定刪除？")) return;
    try {
      await fetch(`/api/speakers/${id}`, { method: "DELETE" });
      fetchSpeakers();
    } catch (e) {
      console.error("Failed to delete speaker", e);
    }
  };

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
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
          <Plus className="w-4 h-4" /> 新增講者
        </button>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted uppercase tracking-wider bg-cream/50">
              <th className="px-6 py-3 font-medium">姓名</th>
              <th className="px-6 py-3 font-medium">所屬單位</th>
              <th className="px-6 py-3 font-medium">職稱</th>
              <th className="px-6 py-3 font-medium">狀態</th>
              <th className="px-6 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((s: any) => (
              <tr key={s.id} className="hover:bg-cream/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cream-dark flex items-center justify-center text-sm text-muted font-medium">{(s.name || "?").charAt(0)}</div>
                    <div>
                      <span className="text-sm font-medium text-dark">{s.name}</span>
                      {s.nameEn && <p className="text-xs text-muted">{s.nameEn}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted">{s.affiliation}</td>
                <td className="px-6 py-4 text-sm text-muted">{s.title}</td>
                <td className="px-6 py-4"><StatusBadge status={s.status || "draft"} /></td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-muted hover:text-gold rounded-md hover:bg-gold/10"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted">尚無講者資料</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-lg font-semibold text-dark">{editing ? "編輯講者" : "新增講者"}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">姓名（中文）</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">姓名（英文）</label>
                <input type="text" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">所屬單位</label>
              <input type="text" value={form.affiliation} onChange={(e) => setForm({ ...form, affiliation: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">職稱</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">簡介</label>
              <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">狀態</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white">
                <option value="draft">草稿</option>
                <option value="confirmed">已確認</option>
                <option value="pending">待確認</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-gold text-white text-sm rounded-lg">儲存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProgrammePanel({ siteId }: { siteId: number }) {
  const [days, setDays] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ sessionType: "keynote", titleZh: "", titleEn: "", startTime: "", duration: 30, sortOrder: 0 });

  const fetchProgramme = useCallback(async () => {
    try {
      const res = await fetch(`/api/programme?siteId=${siteId}`);
      if (!res.ok) return;
      const data = await res.json();
      setDays(data);
    } catch { /* ignore */ }
  }, [siteId]);

  useEffect(() => { fetchProgramme(); }, [fetchProgramme]);

  const day = days[activeDay];

  const openAdd = () => {
    if (!day) return;
    setEditing(null);
    setForm({ sessionType: "keynote", titleZh: "", titleEn: "", startTime: "", duration: 30, sortOrder: (day.sessions?.length || 0) + 1 });
    setShowForm(true);
  };

  const openEdit = (session: any) => {
    setEditing(session);
    setForm({
      sessionType: session.sessionType || session.type || "keynote",
      titleZh: session.titleZh || "",
      titleEn: session.titleEn || "",
      startTime: session.startTime || "",
      duration: session.duration || 30,
      sortOrder: session.sortOrder || 0,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await fetch(`/api/sessions/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/programme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "session", dayId: day.id, ...form }),
        });
      }
      setShowForm(false);
      fetchProgramme();
    } catch (e) {
      console.error("Failed to save session", e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定刪除？")) return;
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      fetchProgramme();
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  };

  const sessionTypeLabels: Record<string, string> = {
    opening: "開幕典禮",
    keynote: "專題演講",
    paper: "論文發表",
    roundtable: "圓桌論壇",
    dinner: "晚宴",
    closing: "閉幕典禮",
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {days.map((d: any, i: number) => (
            <button key={d.id || i} onClick={() => setActiveDay(i)} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeDay === i ? "bg-dark text-cream" : "bg-white border border-border text-muted hover:text-dark"}`}>
              {d.label || d.title || `Day ${i + 1}`} {d.date ? `· ${new Date(d.date).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })}` : ""}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
          <Plus className="w-4 h-4" /> 新增場次
        </button>
      </div>

      {day && day.theme && (
        <div className="mb-4 p-4 bg-cream-dark rounded-lg">
          <p className="text-sm text-muted font-medium">{day.theme}</p>
        </div>
      )}

      <div className="space-y-3">
        {day?.sessions?.map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl border border-border p-5 flex items-start justify-between">
            <div className="flex gap-5">
              <div className="text-right w-20 shrink-0">
                <p className="text-lg font-semibold text-dark">{s.startTime || ""}</p>
                {s.duration && <p className="text-xs text-muted">{s.duration} min</p>}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SessionBadge type={s.sessionType || s.type || ""} label={sessionTypeLabels[s.sessionType || s.type || ""] || s.sessionType || s.type || ""} />
                </div>
                <p className="text-sm font-medium text-dark">{s.titleZh || s.titleEn || s.title || ""}</p>
                {s.speakers && s.speakers.length > 0 && (
                  <p className="text-xs text-muted mt-1">{s.speakers.map((sp: any) => sp.name || sp).join(", ")}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(s)} className="p-1.5 text-muted hover:text-gold rounded-md hover:bg-gold/10"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(s.id)} className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {(!day || !day.sessions || day.sessions.length === 0) && (
          <div className="text-center text-sm text-muted py-8">尚無場次資料</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-lg font-semibold text-dark">{editing ? "編輯場次" : "新增場次"}</h3>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">場次類型</label>
              <select value={form.sessionType} onChange={(e) => setForm({ ...form, sessionType: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white">
                <option value="opening">開幕典禮</option>
                <option value="keynote">專題演講</option>
                <option value="paper">論文發表</option>
                <option value="roundtable">圓桌論壇</option>
                <option value="dinner">晚宴</option>
                <option value="closing">閉幕典禮</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">標題（中文）</label>
                <input type="text" value={form.titleZh} onChange={(e) => setForm({ ...form, titleZh: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">標題（英文）</label>
                <input type="text" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">開始時間</label>
                <input type="text" placeholder="9:00 AM" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">時長（分鐘）</label>
                <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">排序</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-gold text-white text-sm rounded-lg">儲存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PapersPanel({ siteId }: { siteId: number }) {
  const [papers, setPapers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ titleZh: "", titleEn: "", abstract: "", status: "draft", speakerId: "", sessionId: "" });

  const fetchPapers = useCallback(async () => {
    try {
      const res = await fetch(`/api/papers?siteId=${siteId}`);
      if (!res.ok) return;
      const data = await res.json();
      setPapers(data);
    } catch { /* ignore */ }
  }, [siteId]);

  useEffect(() => { fetchPapers(); }, [fetchPapers]);

  const openAdd = () => {
    setEditing(null);
    setForm({ titleZh: "", titleEn: "", abstract: "", status: "draft", speakerId: "", sessionId: "" });
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      titleZh: item.titleZh || "",
      titleEn: item.titleEn || "",
      abstract: item.abstract || "",
      status: item.status || "draft",
      speakerId: item.speakerId?.toString() || "",
      sessionId: item.sessionId?.toString() || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const payload: any = { ...form };
      if (payload.speakerId) payload.speakerId = parseInt(payload.speakerId);
      else delete payload.speakerId;
      if (payload.sessionId) payload.sessionId = parseInt(payload.sessionId);
      else delete payload.sessionId;

      if (editing) {
        await fetch(`/api/papers/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/papers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, siteId }),
        });
      }
      setShowForm(false);
      fetchPapers();
    } catch (e) {
      console.error("Failed to save paper", e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定刪除？")) return;
    try {
      await fetch(`/api/papers/${id}`, { method: "DELETE" });
      fetchPapers();
    } catch (e) {
      console.error("Failed to delete paper", e);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-dark">所有論文</h2>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
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
            {papers.map((p: any) => (
              <tr key={p.id} className="hover:bg-cream/30">
                <td className="px-6 py-4 text-sm font-medium text-dark max-w-[300px] truncate">{p.titleZh || p.titleEn || ""}</td>
                <td className="px-6 py-4">
                  <div>
                    <span className="text-sm text-dark">{p.speaker?.name || ""}</span>
                    {p.speaker?.affiliation && <><br /><span className="text-xs text-muted">{p.speaker.affiliation}</span></>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted">{p.session?.titleZh || p.session?.titleEn || ""}</td>
                <td className="px-6 py-4"><StatusBadge status={p.status || "draft"} /></td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-muted hover:text-gold rounded-md hover:bg-gold/10"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {papers.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted">尚無論文資料</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-lg font-semibold text-dark">{editing ? "編輯論文" : "新增論文"}</h3>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">標題（中文）</label>
              <input type="text" value={form.titleZh} onChange={(e) => setForm({ ...form, titleZh: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">標題（英文）</label>
              <input type="text" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">摘要</label>
              <textarea rows={3} value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">狀態</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white">
                <option value="draft">草稿</option>
                <option value="accepted">已接受</option>
                <option value="under_review">審核中</option>
                <option value="pending">待確認</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-gold text-white text-sm rounded-lg">儲存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ExhibitionPanel({ siteId }: { siteId: number }) {
  const [exhibition, setExhibition] = useState<any>(null);
  const [form, setForm] = useState({ titleZh: "", titleEn: "", description: "", startDate: "", endDate: "", venue: "" });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/exhibitions?siteId=${siteId}`);
        if (!res.ok) return;
        const data = await res.json();
        const ex = Array.isArray(data) ? data[0] : data;
        if (ex) {
          setExhibition(ex);
          setForm({
            titleZh: ex.titleZh || ex.title || "",
            titleEn: ex.titleEn || "",
            description: ex.description || "",
            startDate: ex.startDate ? ex.startDate.slice(0, 10) : "",
            endDate: ex.endDate ? ex.endDate.slice(0, 10) : "",
            venue: ex.venue || "",
          });
        }
      } catch { /* ignore */ }
      setLoaded(true);
    }
    load();
  }, [siteId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (exhibition) {
        await fetch(`/api/exhibitions/${exhibition.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        const res = await fetch("/api/exhibitions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, siteId }),
        });
        if (res.ok) {
          const created = await res.json();
          setExhibition(created);
        }
      }
    } catch (e) {
      console.error("Failed to save exhibition", e);
    }
    setSaving(false);
  };

  if (!loaded) return <div className="flex items-center justify-center py-20"><div className="text-sm text-muted">載入中...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark">展覽管理</h2>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50">
          {saving ? "儲存中..." : "儲存變更"}
        </button>
      </div>
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark mb-1">展覽名稱（中文）</label>
          <input type="text" value={form.titleZh} onChange={(e) => setForm({ ...form, titleZh: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">展覽名稱（英文）</label>
          <input type="text" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">展覽說明</label>
          <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">開始日期</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1">結束日期</label>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">展覽場地</label>
          <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
      </div>
    </div>
  );
}

function VenuesPanel({ siteId }: { siteId: number }) {
  const [venues, setVenues] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", nameZh: "", type: "", capacity: 0 });

  const fetchVenues = useCallback(async () => {
    try {
      const res = await fetch(`/api/venues?siteId=${siteId}`);
      if (!res.ok) return;
      const data = await res.json();
      setVenues(data);
    } catch { /* ignore */ }
  }, [siteId]);

  useEffect(() => { fetchVenues(); }, [fetchVenues]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", nameZh: "", type: "", capacity: 0 });
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      name: item.name || "",
      nameZh: item.nameZh || "",
      type: item.type || "",
      capacity: item.capacity || 0,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, capacity: parseInt(String(form.capacity)) || 0 };
      if (editing) {
        await fetch(`/api/venues/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/venues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, siteId }),
        });
      }
      setShowForm(false);
      fetchVenues();
    } catch (e) {
      console.error("Failed to save venue", e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定刪除？")) return;
    try {
      await fetch(`/api/venues/${id}`, { method: "DELETE" });
      fetchVenues();
    } catch (e) {
      console.error("Failed to delete venue", e);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-dark">場地管理</h2>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
          <Plus className="w-4 h-4" /> 新增場地
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {venues.map((v: any) => (
          <div key={v.id} className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span className="text-xs text-gold uppercase tracking-wider font-medium">{v.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(v)} className="p-1.5 text-muted hover:text-gold rounded-md hover:bg-gold/10"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(v.id)} className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="font-medium text-dark text-sm mb-1">{v.name}</p>
            <p className="text-xs text-muted mb-3">{v.nameZh}</p>
            <div className="flex items-center gap-4 text-xs text-muted-light">
              <span>容量：{v.capacity} 人</span>
            </div>
          </div>
        ))}
        {venues.length === 0 && (
          <div className="col-span-2 text-center text-sm text-muted py-8">尚無場地資料</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-lg font-semibold text-dark">{editing ? "編輯場地" : "新增場地"}</h3>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">名稱（英文）</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">名稱（中文）</label>
              <input type="text" value={form.nameZh} onChange={(e) => setForm({ ...form, nameZh: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">類型</label>
              <input type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">容量</label>
              <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-gold text-white text-sm rounded-lg">儲存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RegistrationsPanel({ siteId }: { siteId: number }) {
  const [registrations, setRegistrations] = useState<any[]>([]);

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await fetch(`/api/registrations?siteId=${siteId}`);
      if (!res.ok) return;
      const data = await res.json();
      setRegistrations(data);
    } catch { /* ignore */ }
  }, [siteId]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetch(`/api/registrations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchRegistrations();
    } catch (e) {
      console.error("Failed to update registration", e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定刪除？")) return;
    try {
      await fetch(`/api/registrations/${id}`, { method: "DELETE" });
      fetchRegistrations();
    } catch (e) {
      console.error("Failed to delete registration", e);
    }
  };

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
              <th className="px-6 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {registrations.map((r: any) => (
              <tr key={r.id} className="hover:bg-cream/30">
                <td className="px-6 py-4 text-sm font-medium text-dark">{r.name}</td>
                <td className="px-6 py-4 text-sm text-muted">{r.email}</td>
                <td className="px-6 py-4 text-sm text-muted">{r.organization || r.org || ""}</td>
                <td className="px-6 py-4">
                  <select
                    value={r.status || "pending"}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    className="text-xs px-2 py-1 border border-border rounded bg-white"
                  >
                    <option value="pending">待確認</option>
                    <option value="confirmed">已確認</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-muted">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {registrations.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-muted">尚無報名資料</td></tr>
            )}
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

function SettingsPanel({ siteId }: { siteId: number }) {
  const [form, setForm] = useState({ name: "", domain: "", startDate: "", endDate: "" });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sites/${siteId}`);
        if (!res.ok) return;
        const data = await res.json();
        setForm({
          name: data.name || "",
          domain: data.domain || "",
          startDate: data.startDate ? data.startDate.slice(0, 10) : "",
          endDate: data.endDate ? data.endDate.slice(0, 10) : "",
        });
      } catch { /* ignore */ }
      setLoaded(true);
    }
    load();
  }, [siteId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/sites/${siteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch (e) {
      console.error("Failed to save settings", e);
    }
    setSaving(false);
  };

  if (!loaded) return <div className="flex items-center justify-center py-20"><div className="text-sm text-muted">載入中...</div></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dark">網站設定</h2>
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark mb-1">網站名稱</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">網域</label>
          <input type="text" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">活動開始日期</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1">活動結束日期</label>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50">
        {saving ? "儲存中..." : "儲存變更"}
      </button>
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
  const [siteId, setSiteId] = useState<number | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState<Record<SectionKey, boolean>>({
    description: true,
    programme: true,
    exhibition: true,
    venues: true,
    speakers: true,
    papers: true,
    registrations: true,
  });

  // Resolve slug → siteId
  useEffect(() => {
    async function resolve() {
      try {
        const res = await fetch("/api/sites");
        if (!res.ok) return;
        const sites = await res.json();
        const site = sites.find((s: any) => s.slug === siteSlug);
        if (site) setSiteId(site.id);
      } catch { /* ignore */ }
    }
    resolve();
  }, [siteSlug]);

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

          {!siteId && activeTab !== "styles" ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-sm text-muted">載入中...</div>
            </div>
          ) : (
            <>
              {activeTab === "description" && siteId && <DescriptionPanel siteId={siteId} />}
              {activeTab === "programme" && siteId && <ProgrammePanel siteId={siteId} />}
              {activeTab === "exhibition" && siteId && <ExhibitionPanel siteId={siteId} />}
              {activeTab === "venues" && siteId && <VenuesPanel siteId={siteId} />}
              {activeTab === "speakers" && siteId && <SpeakersPanel siteId={siteId} />}
              {activeTab === "papers" && siteId && <PapersPanel siteId={siteId} />}
              {activeTab === "registrations" && siteId && <RegistrationsPanel siteId={siteId} />}
              {activeTab === "styles" && <StylesPanel siteSlug={siteSlug} />}
              {activeTab === "settings" && siteId && <SettingsPanel siteId={siteId} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
