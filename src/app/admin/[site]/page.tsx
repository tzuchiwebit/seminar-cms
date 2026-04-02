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
  Eye,
  BookOpen,
  Lightbulb,
  Heart,
  Globe,
  Mic,
  MessageCircle,
  UtensilsCrossed,
  Camera,
  DoorOpen,
  ClipboardList,
  Clock,
} from "lucide-react";

/* ═══════════════════════════════════════════
   NAV ITEMS
   ═══════════════════════════════════════════ */
type Tab = "appearance" | "description" | "tour" | "programme" | "exhibition" | "venues" | "speakers" | "papers" | "styles" | "settings";

const navItems: { label: string; id: Tab; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "網站外觀", id: "appearance", icon: Globe },
  { label: "活動簡介", id: "description", icon: AlignLeft },
  { label: "導覽梯次", id: "tour", icon: Eye },
  { label: "議程", id: "programme", icon: Calendar },
  { label: "展覽", id: "exhibition", icon: Image },
  { label: "場地", id: "venues", icon: MapPin },
  { label: "講者", id: "speakers", icon: Users },
  { label: "論文", id: "papers", icon: FileText },
  { label: "樣式設定", id: "styles", icon: Palette },
  { label: "設定", id: "settings", icon: Settings },
];

/* ═══════════════════════════════════════════
   SECTION VISIBILITY
   ═══════════════════════════════════════════ */
type SectionKey = "description" | "tour" | "programme" | "exhibition" | "venues" | "speakers" | "papers";

const sectionLabels: Record<SectionKey, string> = {
  description: "活動簡介",
  tour: "導覽梯次",
  programme: "議程",
  exhibition: "展覽",
  venues: "場地",
  speakers: "講者",
  papers: "論文",
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
    registration: "bg-muted text-white",
    opening: "bg-gold text-white",
    keynote: "bg-gold text-white",
    photo: "bg-muted text-white",
    paper_session: "bg-green text-white",
    paper: "bg-green text-white",
    roundtable: "bg-gold text-white",
    break: "bg-muted/60 text-white",
    dinner: "bg-muted text-white",
    closing: "bg-dark text-white",
    exhibition: "bg-gold text-white",
  };
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    registration: ClipboardList,
    opening: DoorOpen,
    keynote: Mic,
    photo: Camera,
    paper_session: FileText,
    paper: FileText,
    roundtable: MessageCircle,
    break: Clock,
    dinner: UtensilsCrossed,
    closing: DoorOpen,
    exhibition: Eye,
  };
  const Icon = icons[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors[type] || "bg-muted text-white"}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════
   TAB PANELS
   ═══════════════════════════════════════════ */


const ICON_OPTIONS = ["BookOpen", "Lightbulb", "Heart", "Globe", "Users", "Calendar", "MapPin", "Eye"];

const highlightIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Lightbulb, Heart, Globe, Users, Calendar, MapPin, Eye,
};

type HighlightItem = { icon: string; label: string; labelEn?: string };

/* ═══════════════════════════════════════════
   APPEARANCE PANEL
   ═══════════════════════════════════════════ */
function AppearancePanel({ siteId, onToast }: { siteId: number; onToast?: (msg: string) => void }) {
  const [favicon, setFavicon] = useState("");
  const [banner, setBanner] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogTitleEn, setOgTitleEn] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogDescriptionEn, setOgDescriptionEn] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sites/${siteId}/settings`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.favicon) setFavicon(data.favicon);
        if (data.banner_image) setBanner(data.banner_image);
        if (data.og_title) setOgTitle(data.og_title);
        if (data.og_title_en) setOgTitleEn(data.og_title_en);
        if (data.og_description) setOgDescription(data.og_description);
        if (data.og_description_en) setOgDescriptionEn(data.og_description_en);
        if (data.og_image) setOgImage(data.og_image);
        else if (data.banner_image) setOgImage(data.banner_image);
      } catch { /* ignore */ }
      setLoaded(true);
    }
    load();
  }, [siteId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const pairs = [
        { key: "favicon", value: favicon },
        { key: "banner_image", value: banner },
        { key: "og_title", value: ogTitle },
        { key: "og_title_en", value: ogTitleEn },
        { key: "og_description", value: ogDescription },
        { key: "og_description_en", value: ogDescriptionEn },
        { key: "og_image", value: ogImage },
      ];
      for (const pair of pairs) {
        await fetch(`/api/sites/${siteId}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pair),
        });
      }
      onToast?.("儲存成功");
    } catch {
      onToast?.("儲存失敗，請重試");
    }
    setSaving(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "favicon" | "banner" | "og") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("siteId", String(siteId));
    formData.append("category", field === "favicon" ? "general" : field === "banner" ? "general" : "general");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        if (field === "favicon") setFavicon(data.path);
        else if (field === "banner") { setBanner(data.path); if (!ogImage) setOgImage(data.path); }
        else setOgImage(data.path);
        onToast?.("上傳成功");
      }
    } catch {
      onToast?.("上傳失敗");
    }
  };

  if (!loaded) return <div className="flex items-center justify-center py-20"><div className="text-sm text-muted">載入中...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark">網站外觀</h2>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50">
          {saving ? "儲存中..." : "儲存變更"}
        </button>
      </div>

      {/* Favicon */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-dark">Favicon</h3>
        <p className="text-xs text-muted">瀏覽器分頁上顯示的小圖示，建議 32x32 或 64x64 PNG</p>
        <div className="flex items-center gap-4">
          {favicon ? (
            <div className="w-12 h-12 border border-border rounded-lg overflow-hidden bg-cream flex items-center justify-center">
              <img src={favicon} alt="favicon" className="w-8 h-8 object-contain" />
            </div>
          ) : (
            <div className="w-12 h-12 border border-dashed border-border rounded-lg flex items-center justify-center text-muted text-xs">
              無
            </div>
          )}
          <div>
            <label className="px-3 py-1.5 bg-cream border border-border rounded-lg text-sm text-dark cursor-pointer hover:bg-cream-dark transition-colors">
              上傳 Favicon
              <input type="file" accept="image/png,image/x-icon,image/svg+xml" className="hidden" onChange={(e) => handleUpload(e, "favicon")} />
            </label>
            {favicon && <p className="text-xs text-muted mt-1">{favicon}</p>}
          </div>
        </div>
      </div>

      {/* Banner Image */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-dark">Banner 橫幅</h3>
        <p className="text-xs text-muted">首頁頂部的橫幅圖片，建議 1920x573px</p>
        {banner ? (
          <div className="border border-border rounded-lg overflow-hidden">
            <img src={banner} alt="banner" className="w-full h-auto" />
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-lg h-32 flex items-center justify-center text-muted text-sm">
            尚未上傳橫幅
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="px-3 py-1.5 bg-cream border border-border rounded-lg text-sm text-dark cursor-pointer hover:bg-cream-dark transition-colors">
            上傳橫幅
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleUpload(e, "banner")} />
          </label>
          <span className="text-xs text-muted">或輸入路徑：</span>
          <input type="text" value={banner} onChange={(e) => { setBanner(e.target.value); if (!ogImage) setOgImage(e.target.value); }} placeholder="/img/about-banner.jpg" className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm" />
        </div>
      </div>

      {/* OG Metadata */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-dark">Social Sharing / OG Metadata</h3>
        <p className="text-xs text-muted">在 Facebook、LINE、Twitter 等社群平台分享時顯示的資訊</p>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">分享標題（中文）</label>
          <input type="text" value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="慈濟全球共善學思會" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">分享標題（英文）</label>
          <input type="text" value={ogTitleEn} onChange={(e) => setOgTitleEn(e.target.value)} placeholder="Tzu Chi Global Symposium" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">分享說明（中文）</label>
          <textarea rows={2} value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} placeholder="應用佛法與當代菩薩道：前瞻佛教的未來" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">分享說明（英文）</label>
          <textarea rows={2} value={ogDescriptionEn} onChange={(e) => setOgDescriptionEn(e.target.value)} placeholder="Applied Buddhism and Contemporary Bodhisattva Path" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">分享圖片 OG Image</label>
          <p className="text-xs text-muted mb-2">建議 1200x630px</p>
          {ogImage ? (
            <div className="border border-border rounded-lg overflow-hidden mb-2" style={{ maxWidth: 400 }}>
              <img src={ogImage} alt="og" className="w-full h-auto" />
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <label className="px-3 py-1.5 bg-cream border border-border rounded-lg text-sm text-dark cursor-pointer hover:bg-cream-dark transition-colors">
              上傳圖片
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleUpload(e, "og")} />
            </label>
            <input type="text" value={ogImage} onChange={(e) => setOgImage(e.target.value)} placeholder="/img/og-image.jpg" className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm" />
          </div>
        </div>

        {/* Preview */}
        {(ogTitle || ogTitleEn || ogImage) && (
          <div className="mt-4 p-4 bg-cream rounded-lg">
            <p className="text-xs text-muted mb-2">預覽 Preview</p>
            <div className="bg-white border border-border rounded-lg overflow-hidden max-w-sm">
              {ogImage && <img src={ogImage} alt="" className="w-full aspect-[1200/630] object-cover" />}
              <div className="p-3">
                <p className="text-sm font-semibold text-dark">{ogTitle || ogTitleEn || "標題"}</p>
                <p className="text-xs text-muted mt-0.5 line-clamp-2">{ogDescription || ogDescriptionEn || "說明"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DescriptionPanel({ siteId, onToast }: { siteId: number; onToast?: (msg: string) => void }) {
  const [headlineZh, setHeadlineZh] = useState("");
  const [headlineEn, setHeadlineEn] = useState("");
  const [bodyZh, setBodyZh] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
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
        if (data.description_highlights) {
          try {
            const parsed = JSON.parse(data.description_highlights);
            if (Array.isArray(parsed)) setHighlights(parsed);
          } catch { /* ignore */ }
        }
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
        { key: "description_highlights", value: JSON.stringify(highlights) },
      ];
      for (const pair of pairs) {
        await fetch(`/api/sites/${siteId}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pair),
        });
      }
      onToast?.("儲存成功");
    } catch (e) {
      console.error("Failed to save description", e);
      onToast?.("儲存失敗，請重試");
    }
    setSaving(false);
  };

  const updateHighlight = (index: number, field: "icon" | "label" | "labelEn", value: string) => {
    const updated = [...highlights];
    updated[index] = { ...updated[index], [field]: value };
    setHighlights(updated);
  };

  const addHighlight = () => {
    setHighlights([...highlights, { icon: "BookOpen", label: "", labelEn: "" }]);
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
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
            <input type="text" value={headlineZh} onChange={(e) => setHeadlineZh(e.target.value)} placeholder="一場探索佛教未來的學術盛會" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1">標題（英文）</label>
            <input type="text" value={headlineEn} onChange={(e) => setHeadlineEn(e.target.value)} placeholder="An Academic Symposium Exploring the Future of Buddhism" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">說明（中文）</label>
          <textarea rows={5} value={bodyZh} onChange={(e) => setBodyZh(e.target.value)} placeholder="請輸入活動說明..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">說明（英文）</label>
          <textarea rows={5} value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} placeholder="Enter event description..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
      </div>

      {/* Highlights */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-dark">亮點</h3>
            <p className="text-xs text-muted mt-0.5">首頁顯示的亮點資訊卡片</p>
          </div>
          <button onClick={addHighlight} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
            <Plus className="w-4 h-4" /> 新增亮點
          </button>
        </div>
        <div className="divide-y divide-border">
          {highlights.map((item, index) => {
            const IconComp = highlightIconMap[item.icon] || BookOpen;
            return (
            <div key={index} className="flex items-center gap-3 px-6 py-4">
              <div className="relative shrink-0">
                <select
                  value={item.icon}
                  onChange={(e) => updateHighlight(index, "icon", e.target.value)}
                  className="w-10 h-10 opacity-0 absolute inset-0 cursor-pointer z-10"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="w-10 h-10 flex items-center justify-center border border-border rounded-lg bg-white pointer-events-none">
                  <IconComp className="w-5 h-5 text-gold" />
                </div>
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-muted">中文</span>
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateHighlight(index, "label", e.target.value)}
                  placeholder="6 場學術論文發表"
                  className="w-full px-3 py-1.5 border border-border rounded-lg text-sm"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-muted">EN</span>
                <input
                  type="text"
                  value={item.labelEn || ""}
                  onChange={(e) => updateHighlight(index, "labelEn", e.target.value)}
                  placeholder="6 Paper Sessions"
                  className="w-full px-3 py-1.5 border border-border rounded-lg text-sm"
                />
              </div>
              <button onClick={() => removeHighlight(index)} className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            );
          })}
          {highlights.length === 0 && (
            <p className="text-sm text-muted text-center py-6">尚未設定亮點</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SpeakersPanel({ siteId, onToast }: { siteId: number; onToast?: (msg: string) => void }) {
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", nameCn: "", affiliation: "", title: "", bio: "", status: "draft" });

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
    setForm({ name: "", nameCn: "", affiliation: "", title: "", bio: "", status: "draft" });
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      name: item.name || "",
      nameCn: item.nameCn || "",
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
      onToast?.(editing ? "儲存成功" : "新增成功");
    } catch (e) {
      console.error("Failed to save speaker", e);
      onToast?.("儲存失敗，請重試");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定刪除？")) return;
    try {
      await fetch(`/api/speakers/${id}`, { method: "DELETE" });
      fetchSpeakers();
      onToast?.("刪除成功");
    } catch (e) {
      console.error("Failed to delete speaker", e);
      onToast?.("儲存失敗，請重試");
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
              <th className="px-6 py-3 font-medium">所屬單位 Affiliation</th>
              <th className="px-6 py-3 font-medium">職稱 Title</th>
              <th className="px-6 py-3 font-medium">狀態</th>
              <th className="px-6 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((s: any) => (
              <tr key={s.id} className="hover:bg-cream/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cream-dark flex items-center justify-center text-xs text-muted font-medium">{(s.name || "?").charAt(0)}</div>
                    <div>
                      <span className="text-xs font-medium text-dark">{s.name}</span>
                      {s.nameCn && <p className="text-xs text-muted">{s.nameCn}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-muted">{s.affiliation}</td>
                <td className="px-6 py-4 text-xs text-muted">{s.title}</td>
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
                <label className="block text-sm font-medium text-dark mb-1">姓名（英文）</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rey-Sheng Her" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">姓名（中文）</label>
                <input type="text" value={form.nameCn} onChange={(e) => setForm({ ...form, nameCn: e.target.value })} placeholder="何日生" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">所屬單位 Affiliation</label>
              <input type="text" value={form.affiliation} onChange={(e) => setForm({ ...form, affiliation: e.target.value })} placeholder="Harvard University" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">職稱 Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Professor, Department of Religion" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">簡介 Bio</label>
              <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="請輸入講者簡介..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
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

function ProgrammePanel({ siteId, onToast }: { siteId: number; onToast?: (msg: string) => void }) {
  const [days, setDays] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ sessionType: "keynote", titleZh: "", titleEn: "", subtitleZh: "", subtitleEn: "", startTime: "", duration: 30, venue: "", sortOrder: 0 });

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
    setForm({ sessionType: "keynote", titleZh: "", titleEn: "", subtitleZh: "", subtitleEn: "", startTime: "", duration: 30, venue: "", sortOrder: (day.sessions?.length || 0) + 1 });
    setShowForm(true);
  };

  const openEdit = (session: any) => {
    setEditing(session);
    setForm({
      sessionType: session.sessionType || session.type || "keynote",
      titleZh: session.titleZh || "",
      titleEn: session.titleEn || "",
      subtitleZh: session.subtitleZh || "",
      subtitleEn: session.subtitleEn || "",
      startTime: session.startTime || "",
      duration: session.duration || 30,
      venue: session.venue || "",
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
      onToast?.(editing ? "儲存成功" : "新增成功");
    } catch (e) {
      console.error("Failed to save session", e);
      onToast?.("儲存失敗，請重試");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定刪除？")) return;
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      fetchProgramme();
      onToast?.("刪除成功");
    } catch (e) {
      console.error("Failed to delete session", e);
      onToast?.("儲存失敗，請重試");
    }
  };

  const sessionTypeLabels: Record<string, string> = {
    registration: "報到",
    opening: "開幕典禮",
    keynote: "專題演講",
    photo: "大合照",
    paper_session: "論文發表",
    paper: "論文發表",
    roundtable: "圓桌論壇",
    break: "休息",
    dinner: "晚宴",
    closing: "閉幕",
    exhibition: "展覽",
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
        {day?.sessions?.map((s: any) => {
          const spkrs = s.sessionSpeakers || [];
          const moderators = spkrs.filter((ss: any) => ss.role === "moderator");
          const speakers = spkrs.filter((ss: any) => ss.role === "speaker");
          const discussants = spkrs.filter((ss: any) => ss.role === "discussant");
          const papers = s.papers || [];
          return (
          <div key={s.id} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div className="flex gap-5 flex-1 min-w-0">
                <div className="text-right w-20 shrink-0">
                  <p className="text-lg font-semibold text-dark">{s.startTime || ""}</p>
                  {s.duration && <p className="text-xs text-muted">{s.duration} min</p>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <SessionBadge type={s.sessionType || s.type || ""} label={sessionTypeLabels[s.sessionType || s.type || ""] || s.sessionType || s.type || ""} />
                    {s.subtitleEn && <span className="text-xs text-muted">{s.subtitleEn.split('\n')[0]}</span>}
                  </div>
                  <p className="text-sm font-medium text-dark">{s.titleEn || s.titleZh || s.title || ""}</p>
                  {s.titleZh && s.titleEn && <p className="text-xs text-muted">{s.titleZh}</p>}

                  {/* Subtitle/Description */}
                  {s.subtitleEn && s.subtitleEn.includes('\n') && (
                    <p className="text-xs text-muted mt-1 whitespace-pre-line line-clamp-3">{s.subtitleEn}</p>
                  )}

                  {/* Moderator */}
                  {moderators.length > 0 && (
                    <p className="text-xs text-gold mt-1.5">
                      Moderator: {moderators.map((ss: any) => ss.speaker?.name || "").join(", ")}
                    </p>
                  )}

                  {/* Speakers */}
                  {speakers.length > 0 && (
                    <p className="text-xs text-muted mt-1">
                      {speakers.map((ss: any) => ss.speaker?.name || "").join(", ")}
                    </p>
                  )}

                  {/* Papers */}
                  {papers.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {papers.map((p: any) => (
                        <p key={p.id} className="text-xs text-muted">
                          <span className="text-dark font-medium">{p.speaker?.name || ""}</span>
                          {p.speaker?.name ? " — " : ""}
                          <span className="text-muted">{p.titleEn || p.titleZh || ""}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Commentators */}
                  {discussants.length > 0 && (
                    <p className="text-xs text-muted mt-1">
                      <span className="text-muted-light">Commentators: </span>
                      {discussants.map((ss: any) => ss.speaker?.name || "").join(", ")}
                    </p>
                  )}

                  {/* Venue */}
                  {s.venue && <p className="text-xs text-gold/70 mt-1">{s.venue}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <button onClick={() => openEdit(s)} className="p-1.5 text-muted hover:text-gold rounded-md hover:bg-gold/10"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          );
        })}
        {(!day || !day.sessions || day.sessions.length === 0) && (
          <div className="text-center text-sm text-muted py-8">尚無場次資料</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[90vw] max-w-7xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-8 pr-10 space-y-4 overflow-y-auto flex-1">
            <h3 className="text-lg font-semibold text-dark">{editing ? "編輯場次" : "新增場次"}</h3>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">場次類型</label>
              <select value={form.sessionType} onChange={(e) => setForm({ ...form, sessionType: e.target.value })} className="w-full px-3 py-2 pr-8 border border-border rounded-lg text-sm bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%235A554B%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
                <option value="registration">報到</option>
                <option value="opening">開幕典禮</option>
                <option value="keynote">專題演講</option>
                <option value="photo">大合照</option>
                <option value="paper_session">論文發表</option>
                <option value="roundtable">圓桌論壇</option>
                <option value="break">休息</option>
                <option value="dinner">晚宴</option>
                <option value="closing">閉幕</option>
                <option value="exhibition">展覽</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">標題（中文）</label>
              <input type="text" value={form.titleZh} onChange={(e) => setForm({ ...form, titleZh: e.target.value })} placeholder="應用佛教與菩薩道" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">標題（英文）</label>
              <input type="text" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="Applied Buddhism and the Bodhisattva Path" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">說明（中文）</label>
              <textarea rows={2} value={form.subtitleZh} onChange={(e) => setForm({ ...form, subtitleZh: e.target.value })} placeholder="場次說明或講者列表..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">說明（英文）</label>
              <textarea rows={2} value={form.subtitleEn} onChange={(e) => setForm({ ...form, subtitleEn: e.target.value })} placeholder="Session description or speaker list..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">開始時間</label>
                <input type="text" placeholder="09:00" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">時長（分鐘）</label>
                <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">場地</label>
                <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Harvard Faculty Club" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">排序</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-gold text-white text-sm rounded-lg">儲存</button>
            </div>
          </div></div>
        </div>
      )}
    </>
  );
}

function PapersPanel({ siteId, onToast }: { siteId: number; onToast?: (msg: string) => void }) {
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
      onToast?.(editing ? "儲存成功" : "新增成功");
    } catch (e) {
      console.error("Failed to save paper", e);
      onToast?.("儲存失敗，請重試");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定刪除？")) return;
    try {
      await fetch(`/api/papers/${id}`, { method: "DELETE" });
      fetchPapers();
      onToast?.("刪除成功");
    } catch (e) {
      console.error("Failed to delete paper", e);
      onToast?.("儲存失敗，請重試");
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
                <td className="px-6 py-4 text-xs font-medium text-dark max-w-[300px] truncate">{p.titleZh || p.titleEn || ""}</td>
                <td className="px-6 py-4">
                  <div>
                    <span className="text-xs text-dark">{p.speaker?.name || ""}</span>
                    {p.speaker?.affiliation && <><br /><span className="text-xs text-muted">{p.speaker.affiliation}</span></>}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-muted">{p.session?.titleZh || p.session?.titleEn || ""}</td>
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
              <input type="text" value={form.titleZh} onChange={(e) => setForm({ ...form, titleZh: e.target.value })} placeholder="佛教平等觀的理論意涵與當代意義" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">標題（英文）</label>
              <input type="text" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="The Theoretical Implication of the Buddhist Concept of Equality" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">摘要</label>
              <textarea rows={3} value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} placeholder="請輸入論文摘要..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
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

function ExhibitionPanel({ siteId, onToast }: { siteId: number; onToast?: (msg: string) => void }) {
  const [exhibition, setExhibition] = useState<any>(null);
  const [form, setForm] = useState({ titleZh: "", titleEn: "", description: "", descriptionEn: "", startDate: "", endDate: "", venue: "" });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [exRes, settingsRes] = await Promise.all([
          fetch(`/api/exhibitions?siteId=${siteId}`),
          fetch(`/api/sites/${siteId}/settings`),
        ]);
        let descEn = "";
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.exhibition_description_en) descEn = settings.exhibition_description_en;
        }
        if (exRes.ok) {
          const data = await exRes.json();
          const ex = Array.isArray(data) ? data[0] : data;
          if (ex) {
            setExhibition(ex);
            setForm({
              titleZh: ex.titleZh || ex.title || "",
              titleEn: ex.titleEn || "",
              description: ex.description || "",
              descriptionEn: descEn,
              startDate: ex.startDate ? ex.startDate.slice(0, 10) : "",
              endDate: ex.endDate ? ex.endDate.slice(0, 10) : "",
              venue: ex.venue || "",
            });
          }
        }
      } catch { /* ignore */ }
      setLoaded(true);
    }
    load();
  }, [siteId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { descriptionEn, ...exForm } = form;
      if (exhibition) {
        await fetch(`/api/exhibitions/${exhibition.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(exForm),
        });
      } else {
        const res = await fetch("/api/exhibitions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...exForm, siteId }),
        });
        if (res.ok) {
          const created = await res.json();
          setExhibition(created);
        }
      }
      // Save English description to site settings
      await fetch(`/api/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "exhibition_description_en", value: descriptionEn }),
      });
      onToast?.("儲存成功");
    } catch (e) {
      console.error("Failed to save exhibition", e);
      onToast?.("儲存失敗，請重試");
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
          <input type="text" value={form.titleZh} onChange={(e) => setForm({ ...form, titleZh: e.target.value })} placeholder="明心" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">展覽名稱（英文）</label>
          <input type="text" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="Journey to Enlightenment" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">展覽說明（中文）</label>
          <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="請輸入展覽說明..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">展覽說明（英文）</label>
          <textarea rows={4} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} placeholder="Enter exhibition description..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
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
          <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Harvard CAMLab Cave" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
      </div>
    </div>
  );
}

function VenuesPanel({ siteId, onToast }: { siteId: number; onToast?: (msg: string) => void }) {
  const [venues, setVenues] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", nameZh: "", description: "", descriptionEn: "", address: "", type: "", capacity: 0 });

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
    setForm({ name: "", nameZh: "", description: "", descriptionEn: "", address: "", type: "", capacity: 0 });
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      name: item.name || "",
      nameZh: item.nameZh || "",
      description: item.description || "",
      descriptionEn: item.descriptionEn || "",
      address: item.address || "",
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
      onToast?.(editing ? "儲存成功" : "新增成功");
    } catch (e) {
      console.error("Failed to save venue", e);
      onToast?.("儲存失敗，請重試");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定刪除？")) return;
    try {
      await fetch(`/api/venues/${id}`, { method: "DELETE" });
      fetchVenues();
      onToast?.("刪除成功");
    } catch (e) {
      console.error("Failed to delete venue", e);
      onToast?.("儲存失敗，請重試");
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
            <p className="text-xs text-muted mb-1">{v.nameZh}</p>
            {v.description && <p className="text-xs text-muted-light">{v.description}</p>}
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
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Student Organization Center at Hilles" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">名稱（中文）</label>
              <input type="text" value={form.nameZh} onChange={(e) => setForm({ ...form, nameZh: e.target.value })} placeholder="哈佛大學學生社團中心" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">說明（中文）</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="學術發表、論壇及交流活動之主場地。" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">說明（英文）</label>
              <input type="text" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} placeholder="Main venue for academic sessions and forums." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Google Maps URL</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="https://maps.google.com/..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">類型</label>
                <input type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="main" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">容量</label>
                <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })} placeholder="300" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
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

type TourGroup = { number: string; title: string; titleEn: string; sub: string; subEn: string; tag: string; tagEn: string };

function TourPanel({ siteId, onToast }: { siteId: number; onToast?: (msg: string) => void }) {
  const [tours, setTours] = useState<TourGroup[]>([]);
  const [headerText, setHeaderText] = useState("每梯次七十五分鐘\n三梯次，每梯次二十人");
  const [headerEn, setHeaderEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sites/${siteId}/settings`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.tour_groups) {
          try {
            const parsed = JSON.parse(data.tour_groups);
            if (Array.isArray(parsed)) setTours(parsed);
          } catch { /* ignore */ }
        }
        if (data.tour_header) setHeaderText(data.tour_header);
        if (data.tour_header_en) setHeaderEn(data.tour_header_en);
      } catch { /* ignore */ }
      setLoaded(true);
    }
    load();
  }, [siteId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "tour_groups", value: JSON.stringify(tours) }),
      });
      await fetch(`/api/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "tour_header", value: headerText }),
      });
      await fetch(`/api/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "tour_header_en", value: headerEn }),
      });
      onToast?.("儲存成功");
    } catch (e) {
      console.error("Failed to save tours", e);
      onToast?.("儲存失敗，請重試");
    }
    setSaving(false);
  };

  const addTour = () => {
    const num = String(tours.length + 1).padStart(2, "0");
    setTours([...tours, { number: num, title: "", titleEn: "", sub: "", subEn: "", tag: "", tagEn: "" }]);
  };

  const updateTour = (index: number, field: keyof TourGroup, value: string) => {
    const updated = [...tours];
    updated[index] = { ...updated[index], [field]: value };
    setTours(updated);
  };

  const removeTour = (index: number) => {
    setTours(tours.filter((_, i) => i !== index));
  };

  if (!loaded) return <div className="flex items-center justify-center py-20"><div className="text-sm text-muted">載入中...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark">導覽梯次管理</h2>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50">
          {saving ? "儲存中..." : "儲存變更"}
        </button>
      </div>

      {/* Header text */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark mb-1">說明文字（中文）</label>
          <textarea
            rows={2}
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            placeholder="每梯次七十五分鐘..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">說明文字（英文）</label>
          <textarea
            rows={2}
            value={headerEn}
            onChange={(e) => setHeaderEn(e.target.value)}
            placeholder="75 minutes per group..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Tour groups */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-dark">梯次列表</h3>
          <button onClick={addTour} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
            <Plus className="w-4 h-4" /> 新增梯次
          </button>
        </div>
        <div className="divide-y divide-border">
          {tours.map((tour, index) => (
            <div key={index} className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gold font-inter text-2xl font-light">{tour.number}</span>
                <button onClick={() => removeTour(index)} className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">名稱（中文）</label>
                  <input type="text" value={tour.title} onChange={(e) => updateTour(index, "title", e.target.value)} placeholder="慈濟台灣與美國志工" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">說明（中文）</label>
                  <input type="text" value={tour.sub} onChange={(e) => updateTour(index, "sub", e.target.value)} placeholder="二十人一梯次，75 分鐘" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">標籤（中文）</label>
                  <input type="text" value={tour.tag} onChange={(e) => updateTour(index, "tag", e.target.value)} placeholder="中文導覽" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">名稱（英文）</label>
                  <input type="text" value={tour.titleEn || ""} onChange={(e) => updateTour(index, "titleEn", e.target.value)} placeholder="Tzu Chi Volunteers" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">說明（英文）</label>
                  <input type="text" value={tour.subEn || ""} onChange={(e) => updateTour(index, "subEn", e.target.value)} placeholder="20 people per group, 75 min" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">標籤（英文）</label>
                  <input type="text" value={tour.tagEn || ""} onChange={(e) => updateTour(index, "tagEn", e.target.value)} placeholder="English Tour" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
              </div>
            </div>
          ))}
          {tours.length === 0 && (
            <p className="text-sm text-muted text-center py-8">尚未設定導覽梯次</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ siteId, onToast }: { siteId: number; onToast?: (msg: string) => void }) {
  const [form, setForm] = useState({ name: "" });
  const [siteLang, setSiteLang] = useState("both");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Deploy state
  const [showDeploy, setShowDeploy] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{label: string; passed: boolean; detail?: string}[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [siteRes, settingsRes] = await Promise.all([
          fetch(`/api/sites/${siteId}`),
          fetch(`/api/sites/${siteId}/settings`),
        ]);
        if (siteRes.ok) {
          const data = await siteRes.json();
          setForm({ name: data.name || "" });
        }
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.site_language) setSiteLang(settings.site_language);
        }
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
      await fetch(`/api/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "site_language", value: siteLang }),
      });
      onToast?.("儲存成功");
    } catch (e) {
      console.error("Failed to save settings", e);
      onToast?.("儲存失敗，請重試");
    }
    setSaving(false);
  };

  const handleDeploy = async () => {
    setValidating(true);
    setShowDeploy(true);
    const results: {label: string; passed: boolean; detail?: string}[] = [];

    try {
      const [settingsRes, speakersRes, programmeRes] = await Promise.all([
        fetch(`/api/sites/${siteId}/settings`),
        fetch(`/api/speakers?siteId=${siteId}`),
        fetch(`/api/programme?siteId=${siteId}`),
      ]);

      const settings = await settingsRes.json();
      const speakers = await speakersRes.json();
      const days = await programmeRes.json();
      const lang = settings.site_language || "both";

      // Check description
      if (lang === "zh" || lang === "both") {
        results.push({
          label: "活動簡介（中文）",
          passed: !!(settings.description_headline && settings.description_body),
          detail: !settings.description_headline ? "缺少標題" : !settings.description_body ? "缺少說明" : undefined,
        });
      }
      if (lang === "en" || lang === "both") {
        results.push({
          label: "Event 說明（英文）",
          passed: !!(settings.description_headline_en && settings.description_body_en),
          detail: !settings.description_headline_en ? "Missing headline" : !settings.description_body_en ? "Missing body" : undefined,
        });
      }

      // Check speakers
      results.push({
        label: "講者 Speakers",
        passed: speakers.length > 0,
        detail: speakers.length === 0 ? "至少需要一位講者" : `${speakers.length} 位講者`,
      });

      // Check programme
      results.push({
        label: "議程 Programme",
        passed: days.length > 0,
        detail: days.length === 0 ? "至少需要一天議程" : `${days.length} 天`,
      });

      // Check days have titles
      if (lang === "zh" || lang === "both") {
        const missingZh = days.filter((d: any) => !d.titleZh);
        results.push({
          label: "議程標題（中文）",
          passed: missingZh.length === 0,
          detail: missingZh.length > 0 ? `${missingZh.length} 天缺少中文標題` : undefined,
        });
      }
      if (lang === "en" || lang === "both") {
        const missingEn = days.filter((d: any) => !d.titleEn);
        results.push({
          label: "議程標題（英文）",
          passed: missingEn.length === 0,
          detail: missingEn.length > 0 ? `${missingEn.length} days missing English title` : undefined,
        });
      }

      // Check appearance
      results.push({
        label: "Banner 橫幅",
        passed: !!(settings.banner_image),
        detail: !settings.banner_image ? "尚未上傳橫幅圖片" : undefined,
      });

      if (lang === "zh" || lang === "both") {
        results.push({
          label: "分享標題（中文）",
          passed: !!(settings.og_title),
          detail: !settings.og_title ? "缺少分享標題" : undefined,
        });
      }
      if (lang === "en" || lang === "both") {
        results.push({
          label: "分享標題（英文）",
          passed: !!(settings.og_title_en),
          detail: !settings.og_title_en ? "缺少英文分享標題" : undefined,
        });
      }

      results.push({
        label: "OG 分享圖片",
        passed: !!(settings.og_image),
        detail: !settings.og_image ? "尚未設定分享圖片" : undefined,
      });

    } catch {
      results.push({ label: "Error", passed: false, detail: "驗證失敗" });
    }

    setValidationResults(results);
    setValidating(false);
  };

  const allPassed = validationResults.length > 0 && validationResults.every(r => r.passed);

  const [deployStatus, setDeployStatus] = useState<"idle" | "publishing" | "success" | "failed">("idle");

  const handlePublish = async () => {
    setDeployStatus("publishing");
    try {
      await fetch(`/api/sites/${siteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "published" }),
      });
      setDeployStatus("success");
    } catch {
      setDeployStatus("failed");
    }
  };

  if (!loaded) return <div className="flex items-center justify-center py-20"><div className="text-sm text-muted">載入中...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark">網站設定</h2>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50">
          {saving ? "儲存中..." : "儲存變更"}
        </button>
      </div>
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark mb-1">網站名稱</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="全球共善學思會" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">網站語言</label>
          <select value={siteLang} onChange={(e) => setSiteLang(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white">
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="both">中文 + English（雙語）</option>
          </select>
          <p className="text-xs text-muted mt-1">English：僅英文 / 中文：僅中文 / 雙語：使用者可切換語言</p>
          <p className="text-xs text-muted mt-1">
            {siteLang === "en" && "部署時將檢查所有英文欄位是否已填寫"}
            {siteLang === "zh" && "部署時將檢查所有中文欄位是否已填寫"}
            {siteLang === "both" && "部署時將檢查所有中英文欄位是否已填寫"}
          </p>
        </div>
      </div>

      {/* Deploy Section */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-dark">部署網站</h3>
            <p className="text-xs text-muted mt-0.5">驗證所有必填內容後發布網站</p>
          </div>
          <button
            onClick={handleDeploy}
            disabled={validating}
            className="px-5 py-2 bg-green text-white text-sm font-medium rounded-lg hover:bg-green/90 transition-colors disabled:opacity-50"
          >
            {validating ? "驗證中..." : "部署"}
          </button>
        </div>
      </div>

      {/* Deploy Modal */}
      {showDeploy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            {/* Validating state */}
            {validating && (
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="w-10 h-10 border-3 border-gold/30 border-t-gold rounded-full animate-spin" />
                <p className="text-sm text-muted">正在檢查所有內容...</p>
              </div>
            )}

            {/* Results state */}
            {!validating && deployStatus !== "success" && (
              <>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${allPassed ? "bg-green" : "bg-red-500"}`}>
                    {allPassed ? "\u2713" : "!"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark">{allPassed ? "檢查通過" : "檢查未通過"}</h3>
                    <p className="text-xs text-muted">{allPassed ? "所有必填內容已完成" : "以下項目需要補充"}</p>
                  </div>
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {validationResults.map((r, i) => (
                    <div key={i} className={`flex items-start gap-3 py-2.5 px-3 rounded-lg ${!r.passed ? "bg-red-50" : ""}`}>
                      <span className={`text-base mt-0.5 ${r.passed ? "text-green" : "text-red-500"}`}>
                        {r.passed ? "\u2713" : "\u2717"}
                      </span>
                      <div>
                        <p className={`text-sm font-medium ${r.passed ? "text-dark" : "text-red-700"}`}>{r.label}</p>
                        {r.detail && <p className={`text-xs ${r.passed ? "text-muted" : "text-red-500"}`}>{r.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-border">
                  <button onClick={() => { setShowDeploy(false); setDeployStatus("idle"); }} className="px-4 py-2 text-sm text-muted hover:text-dark">關閉</button>
                  {allPassed && (
                    <button onClick={handlePublish} disabled={deployStatus === "publishing"} className="px-5 py-2 bg-green text-white text-sm font-medium rounded-lg hover:bg-green/90 disabled:opacity-50">
                      {deployStatus === "publishing" ? "發布中..." : "確認發布"}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Success state */}
            {deployStatus === "success" && (
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="w-14 h-14 rounded-full bg-green/10 flex items-center justify-center">
                  <span className="text-green text-3xl">&#10003;</span>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-dark">發布成功</h3>
                  <p className="text-sm text-muted mt-1">網站已成功發布</p>
                </div>
                <button onClick={() => { setShowDeploy(false); setDeployStatus("idle"); }} className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg">
                  完成
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[200] transition-all duration-300">
      <div className="bg-dark text-cream px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
        <span className="text-green">&#10003;</span>
        {message}
      </div>
    </div>
  );
}

export default function SiteDashboard() {
  const params = useParams();
  const siteSlug = params.site as string;
  const [activeTab, setActiveTab] = useState<Tab>("description");
  const [siteId, setSiteId] = useState<number | null>(null);
  const [siteName, setSiteName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState<Record<SectionKey, boolean>>({
    description: true,
    tour: true,
    programme: true,
    exhibition: true,
    venues: true,
    speakers: true,
    papers: true,
  });

  // Resolve slug → siteId
  useEffect(() => {
    async function resolve() {
      try {
        const res = await fetch("/api/sites");
        if (!res.ok) return;
        const sites = await res.json();
        const site = sites.find((s: any) => s.slug === siteSlug);
        if (site) {
          setSiteId(site.id);
          setSiteName(site.name || "");
          // Load saved section visibility
          try {
            const settingsRes = await fetch(`/api/sites/${site.id}/settings`);
            if (settingsRes.ok) {
              const data = await settingsRes.json();
              const vis: Record<string, boolean> = {};
              for (const [k, v] of Object.entries(data)) {
                if (k.startsWith("section_") && k.endsWith("_visible")) {
                  const section = k.replace("section_", "").replace("_visible", "");
                  vis[section] = v === "true";
                }
              }
              if (Object.keys(vis).length > 0) {
                setSectionVisibility(prev => ({ ...prev, ...vis }));
              }
            }
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }
    resolve();
  }, [siteSlug]);

  const toggleSection = async (key: SectionKey) => {
    const newValue = !sectionVisibility[key];
    setSectionVisibility((prev) => ({ ...prev, [key]: newValue }));
    if (siteId) {
      try {
        await fetch(`/api/sites/${siteId}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: `section_${key}_visible`, value: newValue ? "true" : "false" }),
        });
        const label = sectionLabels[key];
        setToast(`${label} ${newValue ? "已顯示" : "已隱藏"}`);
      } catch (e) { console.error("Failed to save section visibility", e); }
    }
  };

  const tabTitles: Record<Tab, string> = {
    appearance: "網站外觀",
    description: "活動簡介",
    tour: "導覽梯次",
    programme: "議程管理",
    exhibition: "展覽管理",
    venues: "場地管理",
    speakers: "講者管理",
    papers: "論文管理",
    styles: "樣式設定",
    settings: "網站設定",
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className="w-[220px] bg-sidebar fixed left-0 top-0 bottom-0 flex flex-col z-50">
        <div className="px-5 pt-5 pb-3">
          <Link href="/admin" className="flex items-center gap-1.5 text-white/50 text-sm hover:text-white/80 transition-colors">
            <ChevronLeft className="w-4 h-4" /> 所有網站
          </Link>
        </div>
        <div className="px-5 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-white font-serif text-lg shrink-0">善</div>
            <div className="min-w-0">
              <div className="text-white font-serif text-sm font-medium truncate">{siteName || siteSlug}</div>
              <div className="text-white/40 text-xs truncate">/{siteSlug}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
      <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-white">
          <div>
            <h1 className="text-xl font-semibold text-dark">{tabTitles[activeTab]}</h1>
            <p className="text-sm text-muted">{siteName || siteSlug} · /{siteSlug}</p>
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
              {activeTab === "appearance" && siteId && <AppearancePanel siteId={siteId} onToast={setToast} />}
              {activeTab === "description" && siteId && <DescriptionPanel siteId={siteId} onToast={setToast} />}
              {activeTab === "tour" && siteId && <TourPanel siteId={siteId} onToast={setToast} />}
              {activeTab === "programme" && siteId && <ProgrammePanel siteId={siteId} onToast={setToast} />}
              {activeTab === "exhibition" && siteId && <ExhibitionPanel siteId={siteId} onToast={setToast} />}
              {activeTab === "venues" && siteId && <VenuesPanel siteId={siteId} onToast={setToast} />}
              {activeTab === "speakers" && siteId && <SpeakersPanel siteId={siteId} onToast={setToast} />}
              {activeTab === "papers" && siteId && <PapersPanel siteId={siteId} onToast={setToast} />}
              {activeTab === "styles" && <StylesPanel siteSlug={siteSlug} />}
              {activeTab === "settings" && siteId && <SettingsPanel siteId={siteId} onToast={setToast} />}
            </>
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
