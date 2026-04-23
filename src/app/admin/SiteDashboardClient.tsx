"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

import pb from "@/lib/pb";
import { useAuth } from "@/hooks/useAuth";

async function upsertSetting(siteId: string, key: string, value: string) {
  try {
    const existing = await pb.collection("site_settings").getFirstListItem(`site="${siteId}" && key="${key}"`);
    await pb.collection("site_settings").update(existing.id, { value });
  } catch {
    await pb.collection("site_settings").create({ site: siteId, key, value });
  }
}

// Batch upsert — fetch all settings once, then update/create in parallel
async function batchUpsertSettings(siteId: string, pairs: { key: string; value: string }[]) {
  const existing = await pb.collection("site_settings").getFullList({ filter: `site="${siteId}"` });
  const existingMap = new Map(existing.map(r => [r.key, r.id]));
  await Promise.all(pairs.map(({ key, value }) => {
    const id = existingMap.get(key);
    return id
      ? pb.collection("site_settings").update(id, { value })
      : pb.collection("site_settings").create({ site: siteId, key, value });
  }));
}

async function touchLastUpdated(siteId: string) {
  await upsertSetting(siteId, "last_updated", new Date().toISOString());
}

async function loadSettings(siteId: string): Promise<Record<string, string>> {
  const records = await pb.collection("site_settings").getFullList({ filter: `site="${siteId}"` });
  const data: Record<string, string> = {};
  for (const r of records) data[r.key] = r.value;
  return data;
}

async function loadProgrammeData(siteId: string) {
  const days = await pb.collection("days").getFullList({ filter: `site="${siteId}"`, sort: "date,dayNumber" });
  const dayIds = days.map(d => d.id);
  let sessions: any[] = [];
  let sessionSpeakerRecords: any[] = [];
  let papers: any[] = [];
  if (dayIds.length > 0) {
    sessions = await pb.collection("sessions").getFullList({ filter: dayIds.map(id => `day="${id}"`).join(" || "), sort: "sortOrder" });
    const sessionIds = sessions.map(s => s.id);
    if (sessionIds.length > 0) {
      const ssFilter = sessionIds.map(id => `session="${id}"`).join(" || ");
      sessionSpeakerRecords = await pb.collection("session_speakers").getFullList({ filter: ssFilter, expand: "speaker" });
      papers = await pb.collection("papers").getFullList({ filter: ssFilter, sort: "sortOrder", expand: "speaker" });
    }
  }
  return days.map(day => ({
    ...day,
    sessions: sessions.filter(s => s.day === day.id).map(s => ({
      ...s,
      sessionSpeakers: sessionSpeakerRecords.filter(ss => ss.session === s.id).map(ss => ({ ...ss, speaker: ss.expand?.speaker || null })),
      papers: papers.filter(p => p.session === s.id).map(p => ({ ...p, speaker: p.expand?.speaker || null })),
    })),
  }));
}
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
type Tab = "appearance" | "description" | "tour" | "programme" | "venues" | "speakers" | "registration" | "styles" | "settings";

const navItems: { label: string; id: Tab; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "網站外觀", id: "appearance", icon: Globe },
  { label: "活動簡介", id: "description", icon: AlignLeft },
  { label: "導覽梯次", id: "tour", icon: Eye },
  { label: "議程", id: "programme", icon: Calendar },
  { label: "場地", id: "venues", icon: MapPin },
  { label: "講者", id: "speakers", icon: Users },
  { label: "報名設定", id: "registration", icon: ClipboardList },
  { label: "樣式設定", id: "styles", icon: Palette },
  { label: "設定", id: "settings", icon: Settings },
];

/* ═══════════════════════════════════════════
   SECTION VISIBILITY
   ═══════════════════════════════════════════ */
type SectionKey = "description" | "tour" | "programme" | "venues" | "speakers";

const sectionLabels: Record<SectionKey, string> = {
  description: "活動簡介",
  tour: "導覽梯次",
  programme: "議程",
  venues: "場地",
  speakers: "講者",
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
function AppearancePanel({ siteId, onToast }: { siteId: string; onToast?: (msg: string) => void }) {
  const [favicon, setFavicon] = useState("");
  const [banner, setBanner] = useState("");
  const [bannerMobile, setBannerMobile] = useState("");
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
        const data = await loadSettings(siteId);
        if (data.favicon) setFavicon(data.favicon);
        if (data.banner_image) setBanner(data.banner_image);
        if (data.banner_image_mobile) setBannerMobile(data.banner_image_mobile);
        if (data.og_title) setOgTitle(data.og_title);
        if (data.og_title_en) setOgTitleEn(data.og_title_en);
        if (data.og_description) setOgDescription(data.og_description);
        if (data.og_description_en) setOgDescriptionEn(data.og_description_en);
        if (data.og_image) setOgImage(data.og_image);
        else if (data.banner_image) setOgImage(data.banner_image);
      } catch {
        // Load failed — do NOT set loaded to prevent auto-save from overwriting with empty data
        return;
      }
      setLoaded(true);
    }
    load();
  }, [siteId]);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const doSave = useCallback(async (auto = false) => {
    if (!loaded) { if (!auto) onToast?.("資料尚未載入，請重新整理頁面"); return; }
    setSaving(true);
    try {
      await batchUpsertSettings(siteId, [
        { key: "favicon", value: favicon },
        { key: "banner_image", value: banner },
        { key: "banner_image_mobile", value: bannerMobile },
        { key: "og_title", value: ogTitle },
        { key: "og_title_en", value: ogTitleEn },
        { key: "og_description", value: ogDescription },
        { key: "og_description_en", value: ogDescriptionEn },
        { key: "og_image", value: ogImage },
        { key: "last_updated", value: new Date().toISOString() },
      ]);
      onToast?.(auto ? "網站外觀：自動更新成功" : "網站外觀：儲存成功");
    } catch (e: any) {
      if (!auto) onToast?.(`網站外觀：儲存失敗：${e?.message || "請檢查網路連線"}`);
    }
    setSaving(false);
  }, [siteId, favicon, banner, bannerMobile, ogTitle, ogTitleEn, ogDescription, ogDescriptionEn, ogImage, onToast]);

  const doSaveRef = useRef(doSave);
  doSaveRef.current = doSave;

  // Auto-save on unmount (switching sections)
  useEffect(() => {
    return () => { if (loaded) doSaveRef.current(true); };
  }, [loaded]);

  const handleSave = async () => {
    await doSave();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "favicon" | "banner" | "banner-mobile" | "og") => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("site", siteId);
      formData.append("file", file);
      formData.append("category", "general");
      const record = await pb.collection("uploads").create(formData);
      const url = pb.files.getURL(record, record.file);
      if (field === "favicon") { setFavicon(url); await upsertSetting(siteId, "favicon", url); }
      else if (field === "banner") { setBanner(url); await upsertSetting(siteId, "banner_image", url); if (!ogImage) { setOgImage(url); await upsertSetting(siteId, "og_image", url); } }
      else if (field === "banner-mobile") { setBannerMobile(url); await upsertSetting(siteId, "banner_image_mobile", url); }
      else { setOgImage(url); await upsertSetting(siteId, "og_image", url); }
      touchLastUpdated(siteId);
      onToast?.("上傳並儲存成功");
    } catch (err: any) {
      console.error("Upload failed:", err);
      onToast?.(`上傳失敗：${err?.message || "請確認 uploads collection 已建立"}`);
    }
  };

  if (!loaded) return <div className="flex flex-col items-center justify-center py-20 gap-3"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /><div className="text-sm text-muted">載入中...</div></div>;

  return (
    <div className="space-y-6">
      <button data-section-save onClick={handleSave} disabled={saving} className="hidden">儲存</button>

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
          </div>
        </div>
      </div>

      {/* Banner Desktop + Mobile side by side */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-dark">Banner 橫幅</h3>
            <p className="text-xs text-muted">首頁頂部橫幅，建議 1920x573px</p>
            {banner ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <img src={banner} alt="banner" className="w-full h-auto" />
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-lg h-28 flex items-center justify-center text-muted text-sm">尚未上傳</div>
            )}
            <label className="inline-flex px-3 py-1.5 bg-cream border border-border rounded-lg text-sm text-dark cursor-pointer hover:bg-cream-dark transition-colors">
              上傳橫幅
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleUpload(e, "banner")} />
            </label>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-dark">Banner Mobile 手機橫幅</h3>
            <p className="text-xs text-muted">手機版橫幅，建議 750x1000px（直式）</p>
            {bannerMobile ? (
              <div className="border border-border rounded-lg overflow-hidden max-w-[200px]">
                <img src={bannerMobile} alt="banner mobile" className="w-full h-auto" />
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-lg h-28 max-w-[200px] flex items-center justify-center text-muted text-sm">
                {banner ? "使用桌面版" : "尚未上傳"}
              </div>
            )}
            <label className="inline-flex px-3 py-1.5 bg-cream border border-border rounded-lg text-sm text-dark cursor-pointer hover:bg-cream-dark transition-colors">
              上傳手機版
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleUpload(e, "banner-mobile")} />
            </label>
          </div>
        </div>
      </div>

      {/* OG Metadata */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-dark">Social Sharing / OG Metadata</h3>
        <p className="text-xs text-muted">在 Facebook、LINE、Twitter 等社群平台分享時顯示的資訊</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">分享標題（中文）</label>
            <input type="text" value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1">分享標題（英文）</label>
            <input type="text" value={ogTitleEn} onChange={(e) => setOgTitleEn(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">分享說明（中文）</label>
          <textarea rows={2} value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">分享說明（英文）</label>
          <textarea rows={2} value={ogDescriptionEn} onChange={(e) => setOgDescriptionEn(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
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
            <input type="text" value={ogImage} onChange={(e) => setOgImage(e.target.value)} className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm" />
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

function DescriptionPanel({ siteId, onToast }: { siteId: string; onToast?: (msg: string) => void }) {
  const [headlineZh, setHeadlineZh] = useState("");
  const [headlineEn, setHeadlineEn] = useState("");
  const [bodyZh, setBodyZh] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await loadSettings(siteId);
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
      } catch {
        return; // Don't set loaded — prevents auto-save from overwriting with empty data
      }
      setLoaded(true);
    }
    load();
  }, [siteId]);

  const doSave = useCallback(async (h1: string, h1e: string, b: string, be: string, hl: HighlightItem[], auto = false) => {
    setSaving(true);
    try {
      await upsertSetting(siteId, "description_headline", h1);
      await upsertSetting(siteId, "description_headline_en", h1e);
      await upsertSetting(siteId, "description_body", b);
      await upsertSetting(siteId, "description_body_en", be);
      await upsertSetting(siteId, "description_highlights", JSON.stringify(hl));
      touchLastUpdated(siteId);
      onToast?.(auto ? "活動簡介：自動更新成功" : "活動簡介：儲存成功");
    } catch (e: any) {
      if (!auto) onToast?.(`活動簡介：儲存失敗：${e?.message || "請檢查網路連線"}`);
    }
    setSaving(false);
  }, [siteId, onToast]);

  const saveDataRef = useRef({ headlineZh, headlineEn, bodyZh, bodyEn, highlights });
  saveDataRef.current = { headlineZh, headlineEn, bodyZh, bodyEn, highlights };
  const doSaveRef = useRef(doSave);
  doSaveRef.current = doSave;

  // Auto-save on unmount
  useEffect(() => {
    return () => { if (loaded) { const d = saveDataRef.current; doSaveRef.current(d.headlineZh, d.headlineEn, d.bodyZh, d.bodyEn, d.highlights, true); } };
  }, [loaded]);

  const handleSave = async () => {
    await doSave(headlineZh, headlineEn, bodyZh, bodyEn, highlights);
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

  if (!loaded) return <div className="flex flex-col items-center justify-center py-20 gap-3"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /><div className="text-sm text-muted">載入中...</div></div>;

  return (
    <div className="space-y-6">
      <button data-section-save onClick={handleSave} disabled={saving} className="hidden">儲存</button>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-dark">活動簡介</h3>
          <p className="text-xs text-muted mt-0.5">首頁顯示的活動說明與亮點資訊</p>
        </div>
        <div className="p-6 space-y-5">
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
              <div className="relative shrink-0 group">
                <div className="w-10 h-10 flex items-center justify-center border border-border rounded-lg bg-white cursor-pointer hover:bg-cream transition-colors"
                  onClick={(e) => {
                    const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                    if (dropdown) dropdown.classList.toggle("hidden");
                  }}
                >
                  <IconComp className="w-5 h-5 text-gold" />
                </div>
                <div className="hidden absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-20 p-1.5 grid grid-cols-4 gap-1 w-[160px]">
                  {ICON_OPTIONS.map((opt) => {
                    const OptIcon = highlightIconMap[opt] || BookOpen;
                    return (
                      <button key={opt} type="button" onClick={(e) => {
                        updateHighlight(index, "icon", opt);
                        (e.currentTarget.closest(".grid") as HTMLElement)?.parentElement?.classList.add("hidden");
                      }} className={`w-8 h-8 flex items-center justify-center rounded-md hover:bg-cream transition-colors ${item.icon === opt ? "bg-gold/10 ring-1 ring-gold/30" : ""}`} title={opt}>
                        <OptIcon className="w-4 h-4 text-gold" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-muted">中文</span>
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateHighlight(index, "label", e.target.value)}
                 
                  className="w-full px-3 py-1.5 border border-border rounded-lg text-sm"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-muted">EN</span>
                <input
                  type="text"
                  value={item.labelEn || ""}
                  onChange={(e) => updateHighlight(index, "labelEn", e.target.value)}
                 
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

function SpeakersPanel({ siteId, onToast }: { siteId: string; onToast?: (msg: string) => void }) {
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", nameCn: "", affiliation: "", affiliationZh: "", title: "", titleZh: "", bio: "", status: "pending" });
  const [talkTitles, setTalkTitles] = useState<{ en: string; zh: string }[]>([{ en: "", zh: "" }]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showSeeMore, setShowSeeMore] = useState(true);
  const [speakerErrors, setSpeakerErrors] = useState<string[]>([]);
  const [speakersLoading, setSpeakersLoading] = useState(true);
  const [siteLang, setSiteLang] = useState<string>("both");
  const [saving, setSaving] = useState(false);

  const fetchSpeakers = useCallback(async () => {
    try {
      const data = await pb.collection("speakers").getFullList({ filter: `site="${siteId}"` });
      setSpeakers(data);
    } catch (e) { console.error("Failed to fetch speakers", e); }
    setSpeakersLoading(false);
  }, [siteId]);

  useEffect(() => {
    fetchSpeakers();
    loadSettings(siteId).then((data) => {
      if (data.speakers_see_more !== undefined) setShowSeeMore(data.speakers_see_more !== "false");
      setSiteLang(data.site_language || "both");
    }).catch(() => {});
  }, [siteId]);

  const [sortKey, setSortKey] = useState<string>("updated");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const toggleSort = (key: string) => {
    if (sortKey === key) { setSortDir(d => d === "asc" ? "desc" : "asc"); }
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = filter === "All" ? speakers : speakers.filter((s) => s.status?.toLowerCase() === filter.toLowerCase());
  const sorted = sortKey ? [...filtered].sort((a, b) => {
    if (sortKey === "updated") {
      const tA = new Date(a.last_updated || a.updated || 0).getTime();
      const tB = new Date(b.last_updated || b.updated || 0).getTime();
      return sortDir === "asc" ? tA - tB : tB - tA;
    }
    const valA = (sortKey === "name" ? a.name : sortKey === "affiliation" ? a.affiliation : sortKey === "title" ? (a.title_field || a.title) : a.status) || "";
    const valB = (sortKey === "name" ? b.name : sortKey === "affiliation" ? b.affiliation : sortKey === "title" ? (b.title_field || b.title) : b.status) || "";
    return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
  }) : filtered;

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", nameCn: "", affiliation: "", affiliationZh: "", title: "", titleZh: "", bio: "", status: "pending" });
    setTalkTitles([{ en: "", zh: "" }]);
    setPhotoFile(null);
    setPhotoPreview(null);
    setSpeakerErrors([]);
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setSpeakerErrors([]);
    setEditing(item);
    setForm({
      name: item.name || "",
      nameCn: item.nameCn || "",
      affiliation: item.affiliation || "",
      affiliationZh: item.affiliationZh || "",
      title: item.title_field || item.title || "",
      titleZh: item.titleZh || "",
      bio: item.bio || "",
      status: item.status || "pending",
    });
    // Parse talk titles - stored as JSON array or legacy single string
    try {
      const parsed = JSON.parse(item.talkTitle || "[]");
      setTalkTitles(parsed.length > 0 ? parsed : [{ en: "", zh: "" }]);
    } catch {
      setTalkTitles([{ en: "", zh: "" }]);
    }
    setPhotoFile(null);
    setPhotoPreview(item.photo ? pb.files.getURL(item, item.photo) : null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (saving) return;
    const errors: string[] = [];
    const needEn = siteLang === "en" || siteLang === "both";
    const needZh = siteLang === "zh" || siteLang === "both";
    // Name EN always required, Name ZH always optional
    if (!form.name.trim()) errors.push("name");
    if (needEn && !form.affiliation.trim()) errors.push("affiliation");
    if (needZh && !form.affiliationZh.trim()) errors.push("affiliationZh");
    if (needEn && !form.title.trim()) errors.push("title");
    if (needZh && !form.titleZh.trim()) errors.push("titleZh");
    if (errors.length > 0) {
      setSpeakerErrors(errors);
      const labels: Record<string, string> = { name: "姓名（EN）", nameCn: "姓名（中文）", affiliation: "所屬單位（EN）", affiliationZh: "所屬單位（中文）", title: "職稱（EN）", titleZh: "職稱（中文）" };
      onToast?.(`請填寫：${errors.map(e => labels[e]).join("、")}`);
      return;
    }
    setSpeakerErrors([]);
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("nameCn", form.nameCn);
      formData.append("affiliation", form.affiliation);
      formData.append("affiliationZh", form.affiliationZh);
      formData.append("title_field", form.title);
      formData.append("titleZh", form.titleZh);
      // Store multiple talk titles as JSON; also keep first one in legacy fields for backward compat
      const validTitles = talkTitles.filter(t => t.en.trim() || t.zh.trim());
      formData.append("talkTitle", JSON.stringify(validTitles));
      formData.append("bio", form.bio);
      formData.append("status", form.status);
      formData.append("last_updated", new Date().toISOString());
      if (photoFile) formData.append("photo", photoFile);
      if (editing) {
        await pb.collection("speakers").update(editing.id, formData);
      } else {
        formData.append("site", siteId);
        await pb.collection("speakers").create(formData);
      }
      setShowForm(false);
      touchLastUpdated(siteId);
      onToast?.(editing ? "儲存成功" : "新增成功");
      fetchSpeakers();
    } catch (e: any) {
      console.error("Failed to save speaker", e);
      if (e?.data) {
        const fieldErrors = Object.entries(e.data)
          .filter(([k]) => k !== "code" && k !== "message")
          .map(([k, v]: any) => v?.message ? `${k}: ${v.message}` : `${k}`);
        if (fieldErrors.length > 0) {
          onToast?.(`請檢查：${fieldErrors.join("、")}`);
          setSaving(false);
          return;
        }
      }
      onToast?.(`儲存失敗：${e?.message || "請重試"}`);
    } finally {
      setSaving(false);
    }
  };

  const [deleting, setDeleting] = useState(false);
  const handleDelete = async (id: string) => {
    if (!confirm("確定刪除？")) return;
    setDeleting(true);
    try {
      const relatedSS = await pb.collection("session_speakers").getFullList({ filter: `speaker="${id}"` }).catch(() => []);
      for (const ss of relatedSS) {
        await pb.collection("session_speakers").delete(ss.id).catch(() => {});
      }
      await pb.collection("speakers").delete(id);
      setDeleting(false);
      fetchSpeakers();
      onToast?.("刪除成功");
    } catch (e) {
      console.error("Failed to delete speaker", e);
      onToast?.(`刪除失敗：${(e as any)?.message || "請重試"}`);
      setDeleting(false);
    }
  };

  const toggleSeeMore = async () => {
    const newVal = !showSeeMore;
    setShowSeeMore(newVal);
    await upsertSetting(siteId, "speakers_see_more", newVal ? "true" : "false");
    onToast?.(newVal ? "「查看更多」按鈕已顯示" : "「查看更多」按鈕已隱藏");
  };

  return (
    <>
      {deleting && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]"><div className="bg-white rounded-xl px-8 py-6 flex flex-col items-center gap-3 shadow-xl"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /><span className="text-sm font-semibold text-dark">刪除中...</span><span className="text-xs text-muted">刪除過程可能需要一些時間，請耐心等候</span></div></div>}
      {/* See More Toggle */}
      <div className="flex items-center justify-between mb-4 px-4 py-3 bg-white rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${showSeeMore ? "bg-green" : "bg-muted/40"}`} />
          <span className="text-sm text-dark font-medium">
            講者卡片「查看更多」按鈕{showSeeMore ? "已顯示" : "已隱藏"}
          </span>
        </div>
        <SectionToggle enabled={showSeeMore} onToggle={toggleSeeMore} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 border-b border-border">
          {["All", "Confirmed", "Pending"].map((f) => {
            const filterLabels: Record<string, string> = { All: "全部", Confirmed: "已確認", Pending: "待確認" };
            const filterTips: Record<string, string> = { All: "顯示所有講者", Confirmed: "已確認的講者會顯示在公開網站", Pending: "待確認的講者不會顯示在公開網站" };
            return (
            <button key={f} onClick={() => setFilter(f)} title={filterTips[f]} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${filter === f ? "border-gold text-gold" : "border-transparent text-muted hover:text-dark"}`}>
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
              {[
                { key: "name", label: "姓名" },
                { key: "affiliation", label: "所屬單位" },
                { key: "title", label: "職稱" },
                { key: "status", label: "狀態" },
              ].map(col => (
                <th key={col.key} className="px-6 py-3 font-medium cursor-pointer select-none hover:text-dark transition-colors" onClick={() => toggleSort(col.key)}>
                  <span className="flex items-center gap-1">
                    {col.label}
                    <span className="inline-flex flex-col text-[8px] leading-none">
                      <span className={sortKey === col.key && sortDir === "asc" ? "text-gold" : "text-muted/30"}>▲</span>
                      <span className={sortKey === col.key && sortDir === "desc" ? "text-gold" : "text-muted/30"}>▼</span>
                    </span>
                  </span>
                </th>
              ))}
              <th className="px-6 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((s: any) => (
              <tr key={s.id} className="hover:bg-cream/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {s.photo ? (
                      <img src={pb.files.getURL(s, s.photo)} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-cream-dark flex items-center justify-center text-xs text-muted font-medium">{(s.name || "?").charAt(0)}</div>
                    )}
                    <div>
                      <span className="text-xs font-medium text-dark">{s.name}</span>
                      {s.nameCn && <p className="text-xs text-muted">{s.nameCn}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs">
                  <span className="text-dark font-medium">{s.affiliation}</span>
                  {s.affiliationZh && <p className="text-muted">{s.affiliationZh}</p>}
                </td>
                <td className="px-6 py-4 text-xs">
                  <span className="text-dark font-medium">{s.title_field || s.title}</span>
                  {s.titleZh && <p className="text-muted">{s.titleZh}</p>}
                </td>
                <td className="px-6 py-4"><StatusBadge status={s.status || "pending"} /></td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-muted hover:text-gold rounded-md hover:bg-gold/10"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {speakersLoading && (
              <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /><span className="text-sm text-muted">載入中...</span></div></td></tr>
            )}
            {!speakersLoading && sorted.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted">尚無講者資料</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-[90vw] max-w-4xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-8 py-5 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-dark">{editing ? "編輯講者" : "新增講者"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-muted hover:text-dark"><X className="w-5 h-5" /></button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              {/* Photo + Basic Info row */}
              <div className="flex gap-6">
                {/* Photo */}
                <div className="shrink-0 flex flex-col items-center gap-2">
                  {photoPreview ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border border-border">
                      <img src={photoPreview} alt="photo" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-cream-dark flex items-center justify-center text-muted text-sm">
                      無照片
                    </div>
                  )}
                  <label className="px-3 py-1.5 bg-cream border border-border rounded-lg text-xs text-dark cursor-pointer hover:bg-cream-dark transition-colors">
                    上傳照片
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoFile(file);
                        setPhotoPreview(URL.createObjectURL(file));
                      }
                    }} />
                  </label>
                </div>
                {/* Name + Affiliation + Title */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">姓名（英文） <span className="text-red-500">*</span></label>
                      <input type="text" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setSpeakerErrors(prev => prev.filter(x => x !== "name")); }} className={`w-full px-3 py-2 border rounded-lg text-sm ${speakerErrors.includes("name") ? "border-red-400 bg-red-50" : "border-border"}`} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">姓名（中文）</label>
                      <input type="text" value={form.nameCn} onChange={(e) => setForm({ ...form, nameCn: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(siteLang === "en" || siteLang === "both") && (
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">所屬單位 Affiliation（EN） <span className="text-red-500">*</span></label>
                      <input type="text" value={form.affiliation} onChange={(e) => { setForm({ ...form, affiliation: e.target.value }); setSpeakerErrors(prev => prev.filter(x => x !== "affiliation")); }} placeholder="e.g. Tzu Chi University" className={`w-full px-3 py-2 border rounded-lg text-sm ${speakerErrors.includes("affiliation") ? "border-red-400 bg-red-50" : "border-border"}`} />
                    </div>
                    )}
                    {(siteLang === "zh" || siteLang === "both") && (
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">所屬單位（中文） <span className="text-red-500">*</span></label>
                      <input type="text" value={form.affiliationZh} onChange={(e) => { setForm({ ...form, affiliationZh: e.target.value }); setSpeakerErrors(prev => prev.filter(x => x !== "affiliationZh")); }} placeholder="例：慈濟大學" className={`w-full px-3 py-2 border rounded-lg text-sm ${speakerErrors.includes("affiliationZh") ? "border-red-400 bg-red-50" : "border-border"}`} />
                    </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(siteLang === "en" || siteLang === "both") && (
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">職稱 Title（EN） <span className="text-red-500">*</span></label>
                      <input type="text" value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); setSpeakerErrors(prev => prev.filter(x => x !== "title")); }} placeholder="e.g. Professor" className={`w-full px-3 py-2 border rounded-lg text-sm ${speakerErrors.includes("title") ? "border-red-400 bg-red-50" : "border-border"}`} />
                    </div>
                    )}
                    {(siteLang === "zh" || siteLang === "both") && (
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">職稱（中文） <span className="text-red-500">*</span></label>
                      <input type="text" value={form.titleZh} onChange={(e) => { setForm({ ...form, titleZh: e.target.value }); setSpeakerErrors(prev => prev.filter(x => x !== "titleZh")); }} placeholder="例：教授" className={`w-full px-3 py-2 border rounded-lg text-sm ${speakerErrors.includes("titleZh") ? "border-red-400 bg-red-50" : "border-border"}`} />
                    </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Talk Titles — multiple entries */}
              <div className="border-t border-border pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-dark">演講題目 Talk Titles</h4>
                  <button
                    onClick={() => setTalkTitles([...talkTitles, { en: "", zh: "" }])}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-dashed border-gold text-gold rounded-lg hover:bg-gold/5 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> 新增題目
                  </button>
                </div>
                <div className="space-y-2">
                  {talkTitles.map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs text-muted mt-2.5 w-5 shrink-0 text-center">{i + 1}.</span>
                      <div className={`flex-1 grid gap-2 ${siteLang === "both" ? "grid-cols-2" : "grid-cols-1"}`}>
                        {(siteLang === "en" || siteLang === "both") && (
                        <input
                          type="text"
                          value={t.en}
                          onChange={(e) => { const arr = [...talkTitles]; arr[i] = { ...arr[i], en: e.target.value }; setTalkTitles(arr); }}
                          placeholder="Talk title (EN)..."
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                        />
                        )}
                        {(siteLang === "zh" || siteLang === "both") && (
                        <input
                          type="text"
                          value={t.zh}
                          onChange={(e) => { const arr = [...talkTitles]; arr[i] = { ...arr[i], zh: e.target.value }; setTalkTitles(arr); }}
                          placeholder="演講題目（中文）..."
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                        />
                        )}
                      </div>
                      {talkTitles.length > 1 && (
                        <button onClick={() => setTalkTitles(talkTitles.filter((_, j) => j !== i))} className="p-1.5 text-muted hover:text-red-500 mt-1.5 shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio + Status row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">簡介 Bio</label>
                  <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">狀態</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white">
                    <option value="pending">待確認</option>
                    <option value="confirmed">已確認</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-border flex justify-end gap-3 shrink-0 bg-cream/30">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted border border-border rounded-lg hover:bg-cream" disabled={saving}>取消</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light disabled:opacity-50 flex items-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? "儲存中..." : "儲存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProgrammePanel({ siteId, onToast }: { siteId: string; onToast?: (msg: string) => void }) {
  const [days, setDays] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ sessionType: "keynote", titleZh: "", titleEn: "", subtitleZh: "", subtitleEn: "", startTime: "", duration: 30, venue: "", sortOrder: 0, groupPhoto: false });
  const [allSpeakers, setAllSpeakers] = useState<any[]>([]);

  // Session speakers/papers editing
  const [sessionModerators, setSessionModerators] = useState<string[]>([]);
  const [sessionSpeakers, setSessionSpeakersList] = useState<string[]>([]);
  const [sessionDiscussants, setSessionDiscussants] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("speaker");
  const [speakerSearch, setSpeakerSearch] = useState("");
  const [speakerDropdownOpen, setSpeakerDropdownOpen] = useState(false);
  const [paperTitles, setPaperTitles] = useState<Record<string, string>>({});
  const [paperTitlesZh, setPaperTitlesZh] = useState<Record<string, string>>({});
  const speakerDropdownRef = useRef<HTMLDivElement>(null);

  // Close speaker dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (speakerDropdownRef.current && !speakerDropdownRef.current.contains(e.target as Node)) {
        setSpeakerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Day management
  const [showDayForm, setShowDayForm] = useState(false);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [dayForm, setDayForm] = useState({ date: "", titleZh: "", titleEn: "" });

  const [programmeLoading, setProgrammeLoading] = useState(true);
  const [siteLang, setSiteLang] = useState<string>("both");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings(siteId).then((s) => setSiteLang(s.site_language || "both"));
  }, [siteId]);

  const fetchProgramme = useCallback(async () => {
    try {
      const data = await loadProgrammeData(siteId);
      setDays(data); // Already sorted by date from loadProgrammeData
    } catch { /* ignore */ }
    // Also fetch all speakers for assignment
    try {
      const spkData = await pb.collection("speakers").getFullList({ filter: `site="${siteId}"`, sort: "sortOrder" });
      setAllSpeakers(spkData);
    } catch { /* ignore */ }
    setProgrammeLoading(false);
  }, [siteId]);

  useEffect(() => { fetchProgramme(); }, [fetchProgramme]);

  const day = days[activeDay];

  // Day CRUD
  const openAddDay = () => {
    setEditingDay(null);
    setDayForm({ date: "", titleZh: "", titleEn: "" });
    setShowDayForm(true);
  };

  const openEditDay = (d: any) => {
    setEditingDay(d);
    setDayForm({
      date: d.date ? new Date(d.date).toISOString().slice(0, 10) : "",
      titleZh: d.titleZh || "",
      titleEn: d.titleEn || "",
    });
    setShowDayForm(true);
  };

  const [savingDay, setSavingDay] = useState(false);
  const handleSaveDay = async () => {
    if (savingDay) return;
    setSavingDay(true);
    try {
      if (editingDay) {
        await pb.collection("days").update(editingDay.id, dayForm);
      } else {
        await pb.collection("days").create({ site: siteId, dayNumber: 1, ...dayForm });
      }
      setShowDayForm(false);
      onToast?.(editingDay ? "日程已更新" : "日程已新增");
      await fetchProgramme();
    } catch (e: any) {
      onToast?.(`儲存失敗：${e?.message || "請重試"}`);
    } finally {
      setSavingDay(false);
    }
  };

  const [deleting, setDeleting] = useState(false);
  const handleDeleteDay = async (d: any) => {
    const dayIndex = days.findIndex((day: any) => day.id === d.id);
    if (!confirm(`確定刪除 Day ${dayIndex + 1}？所有場次也會一起刪除。`)) return;
    setDeleting(true);
    try {
      // Delete all sessions under this day (and their related records), ignore already-deleted
      const sessions = await pb.collection("sessions").getFullList({ filter: `day="${d.id}"` }).catch(() => []);
      for (const s of sessions) {
        const relatedSpeakers = await pb.collection("session_speakers").getFullList({ filter: `session="${s.id}"` }).catch(() => []);
        for (const ss of relatedSpeakers) {
          await pb.collection("session_speakers").delete(ss.id).catch(() => {});
        }
        const relatedPapers = await pb.collection("papers").getFullList({ filter: `session="${s.id}"` }).catch(() => []);
        for (const paper of relatedPapers) {
          await pb.collection("papers").delete(paper.id).catch(() => {});
        }
        await pb.collection("sessions").delete(s.id).catch(() => {});
      }
      await pb.collection("days").delete(d.id);
      if (activeDay >= days.length - 1) setActiveDay(Math.max(0, days.length - 2));
      onToast?.("日程已刪除");
      fetchProgramme();
    } catch (e: any) {
      onToast?.(`刪除失敗：${e?.message || "請重試"}`);
    } finally {
      setDeleting(false);
    }
  };

  const addSpeakerToSession = (speakerId: string) => {
    if (newRole === "moderator") {
      if (!sessionModerators.includes(speakerId)) setSessionModerators([...sessionModerators, speakerId]);
    } else if (newRole === "speaker") {
      // Allow same speaker multiple times for multiple papers
      const newIdx = sessionSpeakers.length;
      setSessionSpeakersList([...sessionSpeakers, speakerId]);
      // Auto-fill paper title from speaker's talk titles
      const spk = allSpeakers.find((s: any) => s.id === speakerId);
      if (spk) {
        let titles: { en: string; zh: string }[] = [];
        try { titles = JSON.parse(spk.talkTitle || "[]"); } catch { /* ignore */ }
        // Count how many times this speaker is already added to figure out which talk title to use
        const existingCount = sessionSpeakers.filter(id => id === speakerId).length;
        const talk = titles[existingCount] || titles[0] || { en: "", zh: "" };
        const paperKey = `${speakerId}_${newIdx}`;
        if (talk.en) setPaperTitles(prev => ({ ...prev, [paperKey]: talk.en }));
        if (talk.zh) setPaperTitlesZh(prev => ({ ...prev, [paperKey]: talk.zh }));
      }
    } else {
      if (!sessionDiscussants.includes(speakerId)) setSessionDiscussants([...sessionDiscussants, speakerId]);
    }
    setSpeakerSearch("");
    setSpeakerDropdownOpen(false);
  };

  const handleQuickCreateSpeaker = async () => {
    try {
      const newSpeaker = await pb.collection("speakers").create({ site: siteId, name: speakerSearch, status: "pending", last_updated: new Date().toISOString() });
      setAllSpeakers([...allSpeakers, newSpeaker]);
      addSpeakerToSession(newSpeaker.id);
      onToast?.(`已新增講者「${speakerSearch}」`);
    } catch (e: any) { onToast?.(`新增失敗：${e?.message || "請重試"}`); }
  };

  const openAdd = () => {
    if (!day) return;
    setEditing(null);
    setForm({ sessionType: "keynote", titleZh: "", titleEn: "", subtitleZh: "", subtitleEn: "", startTime: "", duration: 30, venue: "", sortOrder: (day.sessions?.length || 0) + 1, groupPhoto: false });
    setSessionModerators([]);
    setSessionSpeakersList([]);
    setSessionDiscussants([]);
    setPaperTitles({});
    setPaperTitlesZh({});
    setSpeakerSearch("");
    setValidationErrors([]);
    setShowForm(true);
  };

  const openEdit = (session: any) => {
    setValidationErrors([]);
    setEditing(session);
    setForm({
      sessionType: session.type || session.sessionType || "keynote",
      titleZh: session.titleZh || "",
      titleEn: session.titleEn || "",
      subtitleZh: session.subtitleZh || "",
      subtitleEn: session.subtitleEn || "",
      startTime: session.startTime || "",
      duration: session.duration || 30,
      venue: session.venue || "",
      sortOrder: session.sortOrder || 0,
      groupPhoto: session.groupPhoto || false,
    });
    // Load session speaker assignments
    const spkrs = session.sessionSpeakers || [];
    setSessionModerators(spkrs.filter((ss: any) => ss.role === "moderator").map((ss: any) => ss.speaker?.id).filter(Boolean));
    setSessionDiscussants(spkrs.filter((ss: any) => ss.role === "discussant").map((ss: any) => ss.speaker?.id).filter(Boolean));

    // Load ALL speakers with role "speaker" from session_speakers
    const ssSpkIds = spkrs.filter((ss: any) => ss.role === "speaker").map((ss: any) => ss.speaker?.id).filter(Boolean);
    setSessionSpeakersList(ssSpkIds);

    // Load paper titles matched to speaker index
    const ptitles: Record<string, string> = {};
    const ptitlesZh: Record<string, string> = {};
    const papers = session.papers || [];
    ssSpkIds.forEach((spkId: string, i: number) => {
      // Find paper for this speaker
      const paper = papers.find((p: any) => p.speaker?.id === spkId);
      if (paper) {
        ptitles[`${spkId}_${i}`] = paper.titleEn || "";
        ptitlesZh[`${spkId}_${i}`] = paper.titleZh || "";
      }
    });
    setPaperTitles(ptitles);
    setPaperTitlesZh(ptitlesZh);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (saving) return;
    // Validate ALL fields client-side before calling PocketBase
    const needsTitle = ["keynote", "paper_session", "roundtable"].includes(form.sessionType);
    const errors: string[] = [];
    if (!form.sessionType) errors.push("場次類型");
    if (!form.startTime.trim()) errors.push("開始時間");
    if (needsTitle && (siteLang === "zh" || siteLang === "both") && !form.titleZh.trim()) errors.push("標題（中文）");
    if (needsTitle && (siteLang === "en" || siteLang === "both") && !form.titleEn.trim()) errors.push("標題（英文）");
    if (!day?.id) errors.push("日程（請先選擇日程）");

    if (errors.length > 0) {
      setValidationErrors(errors);
      onToast?.(`請填寫：${errors.join("、")}`);
      return;
    }
    setValidationErrors([]);
    setSaving(true);

    try {
      // Normalize startTime — ensure HH:MM format
      let normalizedTime = form.startTime.trim();
      if (normalizedTime && !normalizedTime.includes(":")) {
        normalizedTime = `${normalizedTime.padStart(2, "0")}:00`;
      }
      // Auto-fill empty titles with session type label (PocketBase requires titleZh)
      const typeLabelsZh: Record<string, string> = { registration: "報到", opening: "開幕典禮", keynote: "專題演講", photo: "大合照", paper_session: "論文發表", roundtable: "圓桌論壇", break: "茶敘", dinner: "晚宴", closing: "閉幕", exhibition: "展覽" };
      const typeLabelsEn: Record<string, string> = { registration: "Registration", opening: "Opening Ceremony", keynote: "Keynote", photo: "Group Photo", paper_session: "Paper Session", roundtable: "Roundtable", break: "Break", dinner: "Dinner", closing: "Closing", exhibition: "Exhibition" };
      const sessionData = {
        type: form.sessionType,
        titleZh: form.titleZh.trim() || typeLabelsZh[form.sessionType] || form.sessionType,
        titleEn: form.titleEn.trim() || typeLabelsEn[form.sessionType] || form.sessionType,
        subtitleZh: form.subtitleZh || "",
        subtitleEn: form.subtitleEn || "",
        startTime: normalizedTime,
        duration: form.duration || 0,
        venue: form.venue || "",
        sortOrder: form.sortOrder || 0,
        groupPhoto: form.groupPhoto,
      };
      let sessionId: string;
      if (editing) {
        await pb.collection("sessions").update(editing.id, sessionData);
        sessionId = editing.id;
        // Clear existing session_speakers and papers for this session
        const existingSS = await pb.collection("session_speakers").getFullList({ filter: `session="${sessionId}"` });
        for (const ss of existingSS) await pb.collection("session_speakers").delete(ss.id);
        const existingPapers = await pb.collection("papers").getFullList({ filter: `session="${sessionId}"` });
        for (const p of existingPapers) await pb.collection("papers").delete(p.id);
      } else {
        const created = await pb.collection("sessions").create({ day: day.id, ...sessionData });
        sessionId = created.id;
      }
      // Create session_speakers and papers
      for (const spkId of sessionModerators) {
        await pb.collection("session_speakers").create({ session: sessionId, speaker: spkId, role: "moderator" });
      }
      let paperOrder = 1;
      const createdSpeakerIds = new Set<string>();
      for (let i = 0; i < sessionSpeakers.length; i++) {
        const spkId = sessionSpeakers[i];
        // Only create session_speakers record once per unique speaker
        if (!createdSpeakerIds.has(spkId)) {
          await pb.collection("session_speakers").create({ session: sessionId, speaker: spkId, role: "speaker" });
          createdSpeakerIds.add(spkId);
        }
        const paperKey = `${spkId}_${i}`;
        const titleEn = paperTitles[paperKey] || paperTitles[spkId] || "";
        const titleZh = paperTitlesZh[paperKey] || paperTitlesZh[spkId] || "";
        if (titleEn || titleZh) {
          await pb.collection("papers").create({ session: sessionId, speaker: spkId, titleEn, titleZh, sortOrder: paperOrder++ });
        }
      }
      for (const spkId of sessionDiscussants) {
        await pb.collection("session_speakers").create({ session: sessionId, speaker: spkId, role: "discussant" });
      }
      setShowForm(false);
      touchLastUpdated(siteId);
      onToast?.(editing ? "儲存成功" : "新增成功");
      setTimeout(() => fetchProgramme(), 100);
    } catch (e: any) {
      console.error("Failed to save session", e);
      // Parse PocketBase field-level errors and show as validation
      if (e?.data) {
        const fieldErrors = Object.entries(e.data)
          .filter(([k]) => k !== "code" && k !== "message")
          .map(([k, v]: any) => v?.message ? `${k}: ${v.message}` : `${k}`);
        if (fieldErrors.length > 0) {
          onToast?.(`請檢查：${fieldErrors.join("、")}`);
          setSaving(false);
          return; // Form stays open, data intact
        }
      }
      onToast?.(`儲存失敗：${e?.message || "請重試"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定刪除？")) return;
    setDeleting(true);
    try {
      const relatedSpeakers = await pb.collection("session_speakers").getFullList({ filter: `session="${id}"` }).catch(() => []);
      for (const ss of relatedSpeakers) {
        await pb.collection("session_speakers").delete(ss.id).catch(() => {});
      }
      const relatedPapers = await pb.collection("papers").getFullList({ filter: `session="${id}"` }).catch(() => []);
      for (const paper of relatedPapers) {
        await pb.collection("papers").delete(paper.id).catch(() => {});
      }
      await pb.collection("sessions").delete(id);
      setDeleting(false);
      fetchProgramme();
      onToast?.("刪除成功");
    } catch (e) {
      console.error("Failed to delete session", e);
      onToast?.(`刪除失敗：${(e as any)?.message || "請重試"}`);
      setDeleting(false);
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
    break: "茶敘",
    dinner: "晚宴",
    closing: "閉幕",
    exhibition: "展覽",
  };

  return (
    <>
      {deleting && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]"><div className="bg-white rounded-xl px-8 py-6 flex flex-col items-center gap-3 shadow-xl"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /><span className="text-sm font-semibold text-dark">刪除中...</span><span className="text-xs text-muted">刪除過程可能需要一些時間，請耐心等候</span></div></div>}
      {/* ── Day Management ── */}
      <div className="mb-6 p-5 bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">日程</h3>
          <button onClick={openAddDay} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-dashed border-gold text-gold rounded-lg hover:bg-gold/5 transition-colors">
            <Calendar className="w-3.5 h-3.5" /> 新增日程
          </button>
        </div>
        {programmeLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <span className="text-sm text-muted">載入中...</span>
          </div>
        ) : days.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">尚無日程，請先新增日程</p>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {days.map((d: any, i: number) => (
              <button key={d.id || i} onClick={() => setActiveDay(i)} className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeDay === i ? "bg-dark text-cream" : "bg-cream border border-border text-muted hover:text-dark hover:border-dark/20"}`}>
                <span>Day {i + 1}</span>
                {d.date && <span className="ml-1.5 opacity-60">· {new Date(d.date).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Selected Day Info ── */}
      {day && (
        <div className="mb-4 px-5 py-4 bg-white rounded-xl border border-gold/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
              <span className="font-inter text-gold font-bold text-sm">{activeDay + 1}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-dark">
                {day.titleEn || day.titleZh || `Day ${activeDay + 1}`}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {day.titleZh && day.titleEn && <span>{day.titleZh} · </span>}
                {day.date && new Date(day.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => openEditDay(day)} className="p-1.5 text-muted hover:text-gold rounded-md hover:bg-gold/10" title="編輯日程"><Pencil className="w-4 h-4" /></button>
            <button onClick={() => handleDeleteDay(day)} className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50" title="刪除日程"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* ── Sessions (場次) in selected day ── */}
      {day && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-dark uppercase tracking-wider">場次</h3>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
            <Plus className="w-4 h-4" /> 新增場次
          </button>
        </div>
      )}

      {/* Day form modal */}
      {showDayForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDayForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark">{editingDay ? "編輯日程" : "新增日程"}</h3>
              <button onClick={() => setShowDayForm(false)} className="p-1.5 text-muted hover:text-dark"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">日期</label>
                <input type="date" value={dayForm.date} onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">主題（英文）</label>
                <input type="text" value={dayForm.titleEn} onChange={(e) => setDayForm({ ...dayForm, titleEn: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">主題（中文）</label>
                <input type="text" value={dayForm.titleZh} onChange={(e) => setDayForm({ ...dayForm, titleZh: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-cream/30">
              <button onClick={() => setShowDayForm(false)} className="px-4 py-2 text-sm text-muted border border-border rounded-lg hover:bg-cream" disabled={savingDay}>取消</button>
              <button onClick={handleSaveDay} disabled={!dayForm.date || savingDay} className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light disabled:opacity-50 flex items-center gap-2">
                {savingDay && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {savingDay ? "儲存中..." : "儲存"}
              </button>
            </div>
          </div>
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
                    <SessionBadge type={s.type || s.sessionType || ""} label={sessionTypeLabels[s.type || s.sessionType || ""] || s.type || s.sessionType || ""} />
                    {s.groupPhoto && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">大合照</span>}
                  </div>
                  <p className="text-sm font-medium text-dark">{s.titleEn || s.titleZh || ""}</p>
                  {s.titleZh && s.titleEn && <p className="text-xs text-muted">{s.titleZh}</p>}

                  {/* Subtitle */}
                  {(s.subtitleEn || s.subtitleZh) && (
                    <p className="text-xs text-muted mt-1 whitespace-pre-line line-clamp-3">{s.subtitleEn || s.subtitleZh}</p>
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
                  {s.venue && <p className="text-xs text-gold/70 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{s.venue}</p>}
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
          programmeLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              <span className="text-sm text-muted">載入場次資料中...</span>
            </div>
          ) : (
            <div className="text-center text-sm text-muted py-8">尚無場次資料</div>
          )
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-[90vw] max-w-5xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-8 py-5 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-dark">{editing ? "編輯場次" : "新增場次"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-muted hover:text-dark"><X className="w-5 h-5" /></button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              {/* Row 1: Type + Time + Duration */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">場次類型</label>
                  <select value={form.sessionType} onChange={(e) => {
                    const t = e.target.value;
                    const autoFillZh: Record<string, string> = { registration: "報到", opening: "開幕典禮", photo: "大合照", break: "茶敘", dinner: "晚宴", closing: "閉幕", exhibition: "展覽" };
                    const autoFillEn: Record<string, string> = { registration: "Registration", opening: "Opening Ceremony", photo: "Group Photo", break: "Break", dinner: "Dinner", closing: "Closing", exhibition: "Exhibition" };
                    if (autoFillZh[t]) {
                      setForm({ ...form, sessionType: t, titleZh: autoFillZh[t], titleEn: autoFillEn[t] });
                    } else {
                      setForm({ ...form, sessionType: t });
                    }
                  }} className="w-full px-3 py-2 pr-8 border border-border rounded-lg text-sm bg-white">
                    <option value="registration">報到</option>
                    <option value="opening">開幕典禮</option>
                    <option value="keynote">專題演講</option>
                    <option value="photo">大合照</option>
                    <option value="paper_session">論文發表</option>
                    <option value="roundtable">圓桌論壇</option>
                    <option value="break">茶敘</option>
                    <option value="dinner">晚宴</option>
                    <option value="closing">閉幕</option>
                    <option value="exhibition">展覽</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">開始時間 <span className="text-red-500">*</span></label>
                  <div className={`inline-flex items-center gap-1 px-3 py-2 border rounded-lg ${validationErrors.includes("開始時間") ? "border-red-400 bg-red-50" : "border-border"}`}>
                    <select
                      value={form.startTime.split(":")[0] || ""}
                      onChange={(e) => {
                        const mm = form.startTime.split(":")[1] || "00";
                        setForm({ ...form, startTime: e.target.value ? `${e.target.value}:${mm}` : "" });
                        setValidationErrors(prev => prev.filter(x => x !== "開始時間"));
                      }}
                      className="bg-transparent text-sm font-semibold text-dark outline-none cursor-pointer appearance-none text-center w-10"
                    >
                      <option value="">HH</option>
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span className="text-dark font-bold text-base leading-none">:</span>
                    <select
                      value={form.startTime.split(":")[1] || ""}
                      onChange={(e) => {
                        const hh = form.startTime.split(":")[0] || "00";
                        setForm({ ...form, startTime: `${hh}:${e.target.value}` });
                        setValidationErrors(prev => prev.filter(x => x !== "開始時間"));
                      }}
                      className="bg-transparent text-sm font-semibold text-dark outline-none cursor-pointer appearance-none text-center w-10"
                    >
                      <option value="">MM</option>
                      {["00","05","10","15","20","25","30","35","40","45","50","55"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">時長</label>
                    <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">排序</label>
                    <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              {/* Group Photo toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.groupPhoto} onChange={(e) => setForm({ ...form, groupPhoto: e.target.checked })} className="w-4 h-4 rounded border-border text-gold accent-gold" />
                <span className="text-xs font-medium text-muted">含大合照 Group Photo</span>
                {form.groupPhoto && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/10 text-gold font-medium">ON</span>}
              </label>

              {/* Row 2: Titles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">標題（英文）{["keynote","paper_session","roundtable"].includes(form.sessionType) && (siteLang === "en" || siteLang === "both") && <span className="text-red-500">*</span>}</label>
                  <input type="text" value={form.titleEn} onChange={(e) => { setForm({ ...form, titleEn: e.target.value }); setValidationErrors(prev => prev.filter(e => e !== "標題（英文）")); }} className={`w-full px-3 py-2 border rounded-lg text-sm ${validationErrors.includes("標題（英文）") ? "border-red-400 bg-red-50" : "border-border"}`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">標題（中文）{["keynote","paper_session","roundtable"].includes(form.sessionType) && (siteLang === "zh" || siteLang === "both") && <span className="text-red-500">*</span>}</label>
                  <input type="text" value={form.titleZh} onChange={(e) => { setForm({ ...form, titleZh: e.target.value }); setValidationErrors(prev => prev.filter(e => e !== "標題（中文）")); }} className={`w-full px-3 py-2 border rounded-lg text-sm ${validationErrors.includes("標題（中文）") ? "border-red-400 bg-red-50" : "border-border"}`} />
                </div>
              </div>

              {/* Row 3: Descriptions with auto-numbering */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">說明（英文）</label>
                  <textarea rows={3} value={form.subtitleEn} onChange={(e) => setForm({ ...form, subtitleEn: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const ta = e.currentTarget;
                        const pos = ta.selectionStart;
                        const lines = ta.value.substring(0, pos).split("\n");
                        const lastLine = lines[lines.length - 1];
                        const match = lastLine.match(/^(\d+)\.\s/);
                        if (match) {
                          e.preventDefault();
                          const nextNum = parseInt(match[1]) + 1;
                          const insert = `\n${nextNum}. `;
                          const newVal = ta.value.substring(0, pos) + insert + ta.value.substring(pos);
                          setForm({ ...form, subtitleEn: newVal });
                          setTimeout(() => { ta.selectionStart = ta.selectionEnd = pos + insert.length; }, 0);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">說明（中文）</label>
                  <textarea rows={3} value={form.subtitleZh} onChange={(e) => setForm({ ...form, subtitleZh: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const ta = e.currentTarget;
                        const pos = ta.selectionStart;
                        const lines = ta.value.substring(0, pos).split("\n");
                        const lastLine = lines[lines.length - 1];
                        const match = lastLine.match(/^(\d+)\.\s/);
                        if (match) {
                          e.preventDefault();
                          const nextNum = parseInt(match[1]) + 1;
                          const insert = `\n${nextNum}. `;
                          const newVal = ta.value.substring(0, pos) + insert + ta.value.substring(pos);
                          setForm({ ...form, subtitleZh: newVal });
                          setTimeout(() => { ta.selectionStart = ta.selectionEnd = pos + insert.length; }, 0);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
              </div>

              {/* Row 4: Venue */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">場地</label>
                <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>

              {/* Row 5: Speaker & Paper Assignments */}
              {(
                <div className="border-t border-border pt-5 space-y-3">
                  <h4 className="text-sm font-semibold text-dark">講者與論文</h4>

                  {/* List of assigned speakers */}
                  {[
                    ...sessionModerators.map((id, i) => ({ id, role: "moderator", idx: i })),
                    ...sessionSpeakers.map((id, i) => ({ id, role: "speaker", idx: i })),
                    ...sessionDiscussants.map((id, i) => ({ id, role: "discussant", idx: i })),
                  ].map(({ id, role, idx }) => {
                    const spk = allSpeakers.find((s: any) => s.id === id);
                    if (!spk) return null;
                    const paperKey = `${id}_${idx}`;
                    return (
                      <div key={`${role}-${idx}-${id}`} className="flex items-center gap-2 bg-cream/50 rounded-lg px-3 py-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                          role === "moderator" ? "bg-gold text-white" : role === "discussant" ? "bg-muted text-white" : "bg-green text-white"
                        }`}>
                          {role === "moderator" ? "主持" : role === "discussant" ? "與談" : "發表"}
                        </span>
                        <span className="text-xs font-medium text-dark shrink-0 w-28 truncate">{spk.name}</span>
                        {role === "speaker" && (
                          <div className="flex-1 flex gap-1.5">
                            {(siteLang === "en" || siteLang === "both") && (
                              <input
                                type="text"
                                value={paperTitles[paperKey] || paperTitles[id] || ""}
                                onChange={(e) => setPaperTitles({ ...paperTitles, [paperKey]: e.target.value })}
                                placeholder="Paper title (EN)..."
                                className="flex-1 px-2 py-1 border border-border rounded text-xs"
                              />
                            )}
                            {(siteLang === "zh" || siteLang === "both") && (
                              <input
                                type="text"
                                value={paperTitlesZh[paperKey] || paperTitlesZh[id] || ""}
                                onChange={(e) => setPaperTitlesZh({ ...paperTitlesZh, [paperKey]: e.target.value })}
                                placeholder="論文標題（中文）..."
                                className="flex-1 px-2 py-1 border border-border rounded text-xs"
                              />
                            )}
                          </div>
                        )}
                        <button onClick={() => {
                          if (role === "moderator") setSessionModerators(sessionModerators.filter((_, i) => i !== idx));
                          else if (role === "speaker") setSessionSpeakersList(sessionSpeakers.filter((_, i) => i !== idx));
                          else setSessionDiscussants(sessionDiscussants.filter((_, i) => i !== idx));
                        }} className="text-muted hover:text-red-500 text-sm shrink-0">&times;</button>
                      </div>
                    );
                  })}

                  {/* Add new speaker row */}
                  <div className="flex items-center gap-2">
                    <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="px-2 py-1.5 border border-border rounded-lg text-xs bg-white w-20 shrink-0">
                      <option value="speaker">發表</option>
                      <option value="moderator">主持</option>
                      <option value="discussant">與談</option>
                    </select>
                    <div className="relative flex-1" ref={speakerDropdownRef}>
                      <input
                        type="text"
                        value={speakerSearch}
                        onChange={(e) => setSpeakerSearch(e.target.value)}
                        onFocus={() => setSpeakerDropdownOpen(true)}
                        placeholder="搜尋講者名稱，或輸入新講者..."
                        className="w-full px-2 py-1.5 border border-border rounded-lg text-xs"
                      />
                      {speakerDropdownOpen && speakerSearch && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-lg mt-1 shadow-lg z-10 max-h-40 overflow-y-auto">
                          {allSpeakers
                            .filter((s: any) => s.name.toLowerCase().includes(speakerSearch.toLowerCase()) || (s.nameCn && s.nameCn.includes(speakerSearch)))
                            .slice(0, 8)
                            .map((s: any) => (
                              <button key={s.id} onClick={() => addSpeakerToSession(s.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-cream transition-colors">
                                <span>{s.name} {s.nameCn ? `(${s.nameCn})` : ""}</span>
                                {(() => {
                                  let talks: { en: string; zh: string }[] = [];
                                  try { talks = JSON.parse(s.talkTitle || "[]"); } catch { /* */ }
                                  return talks.length > 0 && (
                                    <p className="text-[10px] text-gold truncate">{talks.map(t => t.en || t.zh).join(" / ")}</p>
                                  );
                                })()}
                              </button>
                            ))
                          }
                          {!allSpeakers.some((s: any) => s.name.toLowerCase() === speakerSearch.toLowerCase()) && (
                            <button onClick={() => handleQuickCreateSpeaker()} className="w-full text-left px-3 py-2 text-xs text-gold hover:bg-gold/5 border-t border-border">
                              + 新增講者「{speakerSearch}」
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-border flex justify-end gap-3 shrink-0 bg-cream/30">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted border border-border rounded-lg hover:bg-cream" disabled={saving}>取消</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light disabled:opacity-50 flex items-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? "儲存中..." : "儲存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function VenuesPanel({ siteId, onToast }: { siteId: string; onToast?: (msg: string) => void }) {
  const [venues, setVenues] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", nameZh: "", description: "", descriptionEn: "", address: "", mapUrl: "", type: "", image: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchVenues = useCallback(async () => {
    try {
      const data = await pb.collection("venues").getFullList({ filter: `site="${siteId}"` });
      setVenues(data);
    } catch { /* ignore */ }
    setVenuesLoading(false);
  }, [siteId]);

  useEffect(() => { fetchVenues(); }, [fetchVenues]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", nameZh: "", description: "", descriptionEn: "", address: "", mapUrl: "", type: "", image: "" });
    setImageFile(null);
    setImagePreview(null);
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
      mapUrl: item.mapUrl || "",
      type: item.type || "",
      image: item.image || "",
    });
    setImageFile(null);
    setImagePreview(item.image ? pb.files.getURL(item, item.image) : null);
    setShowForm(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("nameZh", form.nameZh);
      formData.append("description", form.description);
      formData.append("descriptionEn", form.descriptionEn);
      formData.append("address", form.address);
      formData.append("mapUrl", form.mapUrl);
      formData.append("type", form.type);
      if (imageFile) formData.append("image", imageFile);
      if (editing) {
        await pb.collection("venues").update(editing.id, formData);
      } else {
        formData.append("site", siteId);
        await pb.collection("venues").create(formData);
      }
      setShowForm(false);
      touchLastUpdated(siteId);
      onToast?.(editing ? "儲存成功" : "新增成功");
      fetchVenues();
    } catch (e: any) {
      console.error("Failed to save venue", e);
      onToast?.(`儲存失敗：${e?.message || "請重試"}`);
    } finally {
      setSaving(false);
    }
  };

  const [deleting, setDeleting] = useState(false);
  const handleDelete = async (id: string) => {
    if (!confirm("確定刪除？")) return;
    setDeleting(true);
    try {
      await pb.collection("venues").delete(id);
      setDeleting(false);
      fetchVenues();
      onToast?.("刪除成功");
    } catch (e) {
      console.error("Failed to delete venue", e);
      onToast?.(`刪除失敗：${(e as any)?.message || "請重試"}`);
      setDeleting(false);
    }
  };

  return (
    <>
      {deleting && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]"><div className="bg-white rounded-xl px-8 py-6 flex flex-col items-center gap-3 shadow-xl"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /><span className="text-sm font-semibold text-dark">刪除中...</span><span className="text-xs text-muted">刪除過程可能需要一些時間，請耐心等候</span></div></div>}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-dark">場地管理</h2>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
          <Plus className="w-4 h-4" /> 新增場地
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {venuesLoading && (
          <div className="col-span-2 flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <span className="text-sm text-muted">載入中...</span>
          </div>
        )}
        {!venuesLoading && venues.map((v: any) => (
          <div key={v.id} className="bg-white rounded-xl border border-border overflow-hidden">
            {v.image && (
              <div className="w-full h-36 bg-cream-dark overflow-hidden">
                <img src={pb.files.getURL(v, v.image)} alt={v.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6">
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
          </div>
        ))}
        {!venuesLoading && venues.length === 0 && (
          <div className="col-span-2 text-center text-sm text-muted py-8">尚無場地資料</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl space-y-4">
            <h3 className="text-lg font-semibold text-dark">{editing ? "編輯場地" : "新增場地"}</h3>
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-dark mb-1">場地圖片</label>
              {(imagePreview || form.image) ? (
                <div className="w-full h-40 rounded-lg overflow-hidden border border-border mb-2">
                  <img src={imagePreview || form.image} alt="venue" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-40 rounded-lg border border-dashed border-border flex items-center justify-center text-muted text-sm mb-2">
                  尚未上傳圖片
                </div>
              )}
              <label className="px-3 py-1.5 bg-cream border border-border rounded-lg text-sm text-dark cursor-pointer hover:bg-cream-dark transition-colors">
                上傳圖片
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
              </label>
              <span className="text-xs text-muted ml-2">建議 1920x800px</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">名稱（中文）</label>
                <input type="text" value={form.nameZh} onChange={(e) => setForm({ ...form, nameZh: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Name（English）</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">說明（中文）</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Description（English）</label>
                <input type="text" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">地址 Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="59 Shepard St, Cambridge, MA" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Google Maps URL</label>
                <input type="text" value={form.mapUrl} onChange={(e) => setForm({ ...form, mapUrl: e.target.value })} placeholder="https://maps.google.com/..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">類型 Type</label>
              <input type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted" disabled={saving}>取消</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gold text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? "儲存中..." : "儲存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   REGISTRATION SETTINGS PANEL
   ═══════════════════════════════════════════ */

function RegistrationSettingsPanel({ siteId, onToast }: { siteId: string; onToast: (msg: string) => void }) {
  const [googleFormUrl, setGoogleFormUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await loadSettings(siteId);
        setGoogleFormUrl(data.registration_google_form_url || "");
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [siteId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await upsertSetting(siteId, "registration_google_form_url", googleFormUrl.trim());
      await touchLastUpdated(siteId);
      onToast("已儲存報名設定");
    } catch (e) {
      console.error("Failed to save registration settings", e);
      onToast(`儲存失敗：${(e as any)?.message || "請重試"}`);
    }
    setSaving(false);
  }, [siteId, googleFormUrl, onToast]);

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  // Auto-save on unmount
  const googleFormUrlRef = useRef(googleFormUrl);
  googleFormUrlRef.current = googleFormUrl;
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;
  useEffect(() => {
    return () => {
      if (loading) return;
      (async () => {
        try {
          await upsertSetting(siteId, "registration_google_form_url", googleFormUrlRef.current.trim());
          onToastRef.current?.("報名設定：自動更新成功");
        } catch { /* silent */ }
      })();
    };
  }, [loading, siteId]);

  if (loading) return <div className="text-sm text-muted py-10 text-center">載入中...</div>;

  return (
    <>
      <button data-section-save onClick={handleSave} disabled={saving} className="hidden">儲存</button>

      {/* Google Form URL */}
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-dark">報名設定</h3>
          <p className="text-xs text-muted mt-0.5">設定報名表單連結與相關功能</p>
        </div>
        <div className="p-6">
        <label className="block text-sm font-medium text-dark mb-1">Google 表單連結</label>
        <p className="text-xs text-muted mb-3">設定後，前台「立即報名」按鈕將會連結至此 Google 表單。若留空，報名按鈕將不會顯示。</p>
        <input
          type="url"
          value={googleFormUrl}
          onChange={(e) => setGoogleFormUrl(e.target.value)}
          placeholder="https://docs.google.com/forms/d/e/..."
          className="w-full px-4 py-2.5 bg-cream/30 border border-border rounded-lg text-sm text-dark placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
        />
        {googleFormUrl && (
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green" />
            <span className="text-xs text-green font-medium">已設定報名連結</span>
            <a href={googleFormUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:underline ml-auto">
              預覽表單 ↗
            </a>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

function RegistrationsPanel({ siteId, onToast }: { siteId: string; onToast?: (msg: string) => void }) {
  const [registrations, setRegistrations] = useState<any[]>([]);

  const fetchRegistrations = useCallback(async () => {
    try {
      const data = await pb.collection("registrations").getFullList({ filter: `site="${siteId}"`, sort: "-created" });
      setRegistrations(data);
    } catch { /* ignore */ }
  }, [siteId]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await pb.collection("registrations").update(id, { status });
      fetchRegistrations();
    } catch (e) {
      console.error("Failed to update registration", e);
    }
  };

  const [deleting, setDeleting] = useState(false);
  const handleDelete = async (id: string) => {
    if (!confirm("確定刪除？")) return;
    setDeleting(true);
    try {
      await pb.collection("registrations").delete(id);
      await fetchRegistrations();
      onToast?.("刪除成功");
    } catch (e: any) {
      console.error("Failed to delete registration", e);
      onToast?.(`刪除失敗：${e?.message || "請重試"}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {deleting && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]"><div className="bg-white rounded-xl px-8 py-6 flex flex-col items-center gap-3 shadow-xl"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /><span className="text-sm font-semibold text-dark">刪除中...</span><span className="text-xs text-muted">刪除過程可能需要一些時間，請耐心等候</span></div></div>}
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
                <td className="px-6 py-4 text-sm text-muted">{r.created ? new Date(r.created).toLocaleDateString() : ""}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {registrations.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted">尚無報名資料</td></tr>
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
  { label: "Gold Light (Tour)", hex: "#D4B85A" },
  { label: "Green", hex: "#3D5A3E" },
  { label: "Sidebar", hex: "#3D3A36" },
  { label: "Border", hex: "#E5E0D8" },
  { label: "Muted", hex: "#5A554B" },
  { label: "Background", hex: "#FAF8F5" },
  { label: "White", hex: "#FFFFFF" },
];

const defaultTypography: TypographyGroup[] = [
  {
    groupLabel: "標題",
    items: [
      { key: "h1", label: "H1 主標題", fontFamily: "Noto Serif TC", fontSize: 100, fontWeight: 900, lineHeight: 1.1 },
      { key: "h2", label: "H2 區塊標題", fontFamily: "Noto Serif TC", fontSize: 48, fontWeight: 700, lineHeight: 1.2 },
      { key: "h3", label: "H3 副標題", fontFamily: "Noto Serif TC", fontSize: 32, fontWeight: 700, lineHeight: 1.3 },
      { key: "h4", label: "H4 小標題", fontFamily: "Noto Serif TC", fontSize: 24, fontWeight: 600, lineHeight: 1.4 },
    ],
  },
  {
    groupLabel: "標籤 / 分類",
    items: [
      { key: "label", label: "Section Label", fontFamily: "Inter", fontSize: 15, fontWeight: 600, lineHeight: 1.4 },
      { key: "tag", label: "Tag 標籤", fontFamily: "Noto Sans TC", fontSize: 16, fontWeight: 500, lineHeight: 1.4 },
      { key: "nav", label: "Nav 導覽列", fontFamily: "Inter", fontSize: 14, fontWeight: 500, lineHeight: 1.4 },
    ],
  },
  {
    groupLabel: "內文",
    items: [
      { key: "body", label: "Body 內文", fontFamily: "Noto Sans TC", fontSize: 16, fontWeight: 400, lineHeight: 1.8 },
      { key: "body-lg", label: "Body Large", fontFamily: "Noto Sans TC", fontSize: 18, fontWeight: 400, lineHeight: 1.6 },
      { key: "body-sm", label: "Body Small", fontFamily: "Noto Sans TC", fontSize: 15, fontWeight: 400, lineHeight: 1.8 },
    ],
  },
  {
    groupLabel: "小字 / 輔助",
    items: [
      { key: "small", label: "Small 小字", fontFamily: "Noto Sans TC", fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
      { key: "caption", label: "Caption 說明", fontFamily: "Inter", fontSize: 13, fontWeight: 400, lineHeight: 1.4 },
      { key: "tiny", label: "Tiny 極小", fontFamily: "Inter", fontSize: 11, fontWeight: 400, lineHeight: 1.4 },
    ],
  },
  {
    groupLabel: "數字",
    items: [
      { key: "number-lg", label: "Number Large", fontFamily: "Inter", fontSize: 64, fontWeight: 200, lineHeight: 1.0 },
      { key: "number-md", label: "Number Medium", fontFamily: "Inter", fontSize: 30, fontWeight: 700, lineHeight: 1.0 },
    ],
  },
];

const fontFamilyOptions = ["Noto Sans TC", "Noto Serif TC", "Inter"];
const fontWeightOptions = [400, 500, 700, 900];

function StylesPanel({ siteSlug, onToast }: { siteSlug: string; onToast?: (msg: string) => void }) {
  const [colors, setColors] = useState<ThemeColor[]>([]);
  const [typography, setTypography] = useState<TypographyGroup[]>(defaultTypography);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "標題": true, "內文": false, "小字": false });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);

  const [cssRecordId, setCssRecordId] = useState<string | null>(null);

  // Resolve slug to site ID, then fetch from css_variables
  useEffect(() => {
    async function load() {
      try {
        const site = await pb.collection("sites").getFirstListItem(`slug="${siteSlug}"`);
        if (!site) return;
        setSiteId(site.id);

        try {
          const cssRecord = await pb.collection("css_variables").getFirstListItem(`site="${site.id}"`);
          setCssRecordId(cssRecord.id);
          try {
            const parsed = JSON.parse(cssRecord.theme_colors || "[]");
            if (Array.isArray(parsed) && parsed.length > 0) setColors(parsed);
            else setColors(defaultColors);
          } catch { setColors(defaultColors); }
          try {
            const parsed = JSON.parse(cssRecord.theme_typography || "[]");
            if (Array.isArray(parsed) && parsed.length > 0) setTypography(parsed);
          } catch { /* use defaults */ }
        } catch {
          setColors(defaultColors);
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
      const data = { theme_colors: JSON.stringify(colors), theme_typography: JSON.stringify(typography) };
      if (cssRecordId) {
        await pb.collection("css_variables").update(cssRecordId, data);
      } else {
        const record = await pb.collection("css_variables").create({ site: siteId, ...data });
        setCssRecordId(record.id);
      }
      onToast?.("樣式設定：儲存成功");
    } catch (e) {
      console.error("Failed to save styles", e);
      onToast?.(`樣式設定：儲存失敗：${(e as any)?.message || "請重試"}`);
    }
    setSaving(false);
  }, [siteId, colors, typography, cssRecordId, onToast]);

  // For unmount auto-save — save silently then show auto toast
  const autoSave = useCallback(async () => {
    if (!siteId) return;
    try {
      const data = { theme_colors: JSON.stringify(colors), theme_typography: JSON.stringify(typography) };
      if (cssRecordId) {
        await pb.collection("css_variables").update(cssRecordId, data);
      }
      onToast?.("樣式設定：自動更新成功");
    } catch { /* silent */ }
  }, [siteId, colors, typography, cssRecordId, onToast]);

  const autoSaveRef = useRef(autoSave);
  autoSaveRef.current = autoSave;

  useEffect(() => {
    return () => { if (loaded) autoSaveRef.current(); };
  }, [loaded]);

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
      <button data-section-save onClick={handleSave} disabled={saving || !siteId} className="hidden">儲存</button>

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

      {/* Typography section removed — not connected to website */}
    </div>
  );
}

type TourGroup = { number: string; title: string; titleEn: string; sub: string; subEn: string; tag: string; tagEn: string };

function TourPanel({ siteId, onToast }: { siteId: string; onToast?: (msg: string) => void }) {
  const [tours, setTours] = useState<TourGroup[]>([]);
  const [headerText, setHeaderText] = useState("每梯次七十五分鐘\n三梯次，每梯次二十人");
  const [headerEn, setHeaderEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await loadSettings(siteId);
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

  const doSave = useCallback(async (t: TourGroup[], h: string, he: string, auto = false) => {
    setSaving(true);
    try {
      await batchUpsertSettings(siteId, [
        { key: "tour_groups", value: JSON.stringify(t) },
        { key: "tour_header", value: h },
        { key: "tour_header_en", value: he },
        { key: "last_updated", value: new Date().toISOString() },
      ]);
      onToast?.(auto ? "導覽梯次：自動更新成功" : "導覽梯次：儲存成功");
    } catch (e: any) {
      if (!auto) onToast?.(`導覽梯次：儲存失敗：${e?.message || "請檢查網路連線"}`);
    }
    setSaving(false);
  }, [siteId, onToast]);

  const saveDataRef = useRef({ tours, headerText, headerEn });
  saveDataRef.current = { tours, headerText, headerEn };
  const doSaveRef = useRef(doSave);
  doSaveRef.current = doSave;

  // Auto-save on unmount
  useEffect(() => {
    return () => { if (loaded) { const d = saveDataRef.current; doSaveRef.current(d.tours, d.headerText, d.headerEn, true); } };
  }, [loaded]);

  const handleSave = async () => {
    await doSave(tours, headerText, headerEn);
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

  if (!loaded) return <div className="flex flex-col items-center justify-center py-20 gap-3"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /><div className="text-sm text-muted">載入中...</div></div>;

  return (
    <div className="space-y-6">
      <button data-section-save onClick={handleSave} disabled={saving} className="hidden">儲存</button>

      {/* Header text */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-dark">導覽梯次管理</h3>
          <p className="text-xs text-muted mt-0.5">展覽導覽的說明文字與梯次列表</p>
        </div>
        <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark mb-1">說明文字（中文）</label>
          <textarea
            rows={2}
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
           
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1">說明文字（英文）</label>
          <textarea
            rows={2}
            value={headerEn}
            onChange={(e) => setHeaderEn(e.target.value)}
           
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>
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
                  <input type="text" value={tour.title} onChange={(e) => updateTour(index, "title", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">說明（中文）</label>
                  <input type="text" value={tour.sub} onChange={(e) => updateTour(index, "sub", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">標籤（中文）</label>
                  <input type="text" value={tour.tag} onChange={(e) => updateTour(index, "tag", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">名稱（英文）</label>
                  <input type="text" value={tour.titleEn || ""} onChange={(e) => updateTour(index, "titleEn", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">說明（英文）</label>
                  <input type="text" value={tour.subEn || ""} onChange={(e) => updateTour(index, "subEn", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">標籤（英文）</label>
                  <input type="text" value={tour.tagEn || ""} onChange={(e) => updateTour(index, "tagEn", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
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

function SettingsPanel({ siteId, siteSlug, onToast }: { siteId: string; siteSlug: string; onToast?: (msg: string) => void }) {
  const [form, setForm] = useState({ name: "", nameEn: "" });
  const [siteLang, setSiteLang] = useState("both");
  const [siteStatus, setSiteStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Deploy state
  const [showDeploy, setShowDeploy] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{label: string; passed: boolean; detail?: string}[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [siteData, settings] = await Promise.all([
          pb.collection("sites").getOne(siteId),
          loadSettings(siteId),
        ]);
        setForm({ name: siteData.name || "", nameEn: settings.site_name_en || "" });
        setSiteStatus(siteData.status || "draft");
        if (settings.site_language) setSiteLang(settings.site_language);
      } catch { /* ignore */ }
      setLoaded(true);
    }
    load();
  }, [siteId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await pb.collection("sites").update(siteId, { name: form.name });
      await upsertSetting(siteId, "site_name_en", form.nameEn);
      await upsertSetting(siteId, "site_language", siteLang);
      touchLastUpdated(siteId);
      onToast?.("儲存成功");
    } catch (e) {
      console.error("Failed to save settings", e);
      onToast?.(`儲存失敗：${(e as any)?.message || "請重試"}`);
    }
    setSaving(false);
  };

  const handleDeploy = async () => {
    setValidating(true);
    setShowDeploy(true);
    const results: {label: string; passed: boolean; detail?: string}[] = [];

    try {
      const [settings, speakers, days] = await Promise.all([
        loadSettings(siteId),
        pb.collection("speakers").getFullList({ filter: `site="${siteId}"` }),
        loadProgrammeData(siteId),
      ]);
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
      await pb.collection("sites").update(siteId, { ...form, status: "published" });
      setSiteStatus("published");
      // Trigger Cloudflare Pages rebuild via deploy hook
      const hookUrl = await pb.collection("site_settings").getFirstListItem(`site="${siteId}" && key="deploy_hook_url"`).then(r => r.value).catch(() => "");
      if (hookUrl) {
        await fetch(hookUrl, { method: "POST" }).catch(() => {});
      }
      setDeployStatus("success");
    } catch {
      setDeployStatus("failed");
    }
  };

  const handleUnpublish = async () => {
    try {
      await pb.collection("sites").update(siteId, { status: "pending" });
      setSiteStatus("draft");
      onToast?.("網站已取消發布");
    } catch (e: any) {
      onToast?.(`操作失敗：${e?.message || "請重試"}`);
    }
  };

  if (!loaded) return <div className="flex flex-col items-center justify-center py-20 gap-3"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /><div className="text-sm text-muted">載入中...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark">網站設定</h2>
        <button data-section-save onClick={handleSave} disabled={saving} className="hidden">儲存</button>
      </div>
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark mb-1">網站名稱</label>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="中文名稱" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            <input type="text" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="English Name" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
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
            <p className="text-xs text-muted mt-0.5">
              {siteStatus === "published"
                ? "網站已公開。修改內容後，請點擊「重新發布」更新公開網站"
                : "驗證所有必填內容後發布網站"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/${siteSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-white text-dark text-sm font-medium rounded-lg border border-border hover:bg-cream transition-colors inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              預覽
            </a>
            {siteStatus === "published" ? (
              <>
                <button
                  onClick={handleDeploy}
                  disabled={validating}
                  className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  {validating ? "驗證中..." : "重新發布"}
                </button>
                <button
                  onClick={handleUnpublish}
                  className="px-5 py-2 bg-green/10 text-green text-sm font-medium rounded-lg border border-green/30 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-green" />
                  已上線
                </button>
              </>
            ) : (
              <button
                onClick={handleDeploy}
                disabled={validating}
                className="px-5 py-2 bg-green text-white text-sm font-medium rounded-lg hover:bg-green/90 transition-colors disabled:opacity-50"
              >
                {validating ? "驗證中..." : "發布網站"}
              </button>
            )}
          </div>
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
                  <p className="text-sm text-muted mt-1">網站正在更新中，約 1-2 分鐘後即可看到最新內容</p>
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
  const isError = /失敗|錯誤|error|請檢查/i.test(message);
  const isWarning = /請填寫|尚未|incomplete/i.test(message);
  const isSuccess = !isError && !isWarning;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setVisible(false);
    const showTimer = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    // Auto dismiss after 3s
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => { clearTimeout(timer); cancelAnimationFrame(showTimer); };
  }, [message, onClose]);

  const borderColor = isError ? "#dc2626" : isWarning ? "#d97706" : "#22c55e";
  const bgColor = isError ? "#7f1d1d" : isWarning ? "#78350f" : "#14532d";
  const iconBg = isError ? "#dc2626" : isWarning ? "#d97706" : "#22c55e";

  return (
    <div className={`fixed bottom-6 right-6 z-[200] transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
      <style>{`
        @keyframes toast-border-spin {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
      <div className="relative rounded-xl p-[2px] max-w-md" style={{
        background: `linear-gradient(90deg, ${borderColor}, transparent, ${borderColor}, transparent, ${borderColor})`,
        backgroundSize: "200% 100%",
        animation: "toast-border-spin 2s linear infinite",
      }}>
        <div className="rounded-[10px] px-5 py-3.5 flex items-center gap-3 text-sm text-white" style={{ backgroundColor: bgColor }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
            {isError ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            ) : isWarning ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="8" x2="12" y2="13" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            )}
          </div>
          <div className="flex-1 font-medium">{message}</div>
          <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="text-white/60 hover:text-white shrink-0 ml-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SiteDashboard({ slugOverride }: { slugOverride?: string } = {}) {
  const { user, loading: authLoading } = useAuth();
  const siteSlug = slugOverride || "";
  const [activeTab, setActiveTab] = useState<Tab>("description");
  const [siteId, setSiteId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const [topSaving, setTopSaving] = useState(false);
  const showToast = useCallback((msg: string) => { setToast(msg); setToastKey(k => k + 1); }, []);
  // Stop loading ONLY when toast appears (save completed)
  useEffect(() => { if (toast && topSaving) setTopSaving(false); }, [toast, topSaving]);
  const clearToast = useCallback(() => setToast(null), []);
  const [sectionVisibility, setSectionVisibility] = useState<Record<SectionKey, boolean>>({
    description: true,
    tour: true,
    programme: true,
    venues: true,
    speakers: true,
  });

  // Resolve slug → siteId
  useEffect(() => {
    async function resolve() {
      try {
        const site = await pb.collection("sites").getFirstListItem(`slug="${siteSlug}"`);
        if (site) {
          setSiteId(site.id);
          setSiteName(site.name || "");
          document.title = `${site.name || siteSlug} 管理系統`;
          // Load saved section visibility
          try {
            const data = await loadSettings(site.id);
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
        await upsertSetting(siteId, `section_${key}_visible`, newValue ? "true" : "false");
        const label = sectionLabels[key];
        showToast(`${label} ${newValue ? "已顯示" : "已隱藏"}`);
      } catch (e) { console.error("Failed to save section visibility", e); }
    }
  };

  const tabTitles: Record<Tab, string> = {
    appearance: "網站外觀",
    description: "活動簡介",
    tour: "導覽梯次",
    programme: "議程管理",
    venues: "場地管理",
    speakers: "講者管理",
    registration: "報名設定",
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

        {!authLoading && (
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gold/80 flex items-center justify-center text-white text-sm font-medium shrink-0">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-white text-sm truncate">{user?.name || "使用者"}</div>
              <div className="text-white/40 text-xs truncate">{user?.email || ""}</div>
            </div>
          </div>
        </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-8 py-5 border-b border-border bg-white/95 backdrop-blur-sm">
          <div>
            <h1 className="text-xl font-semibold text-dark">{tabTitles[activeTab]}</h1>
            <p className="text-sm text-muted mt-0.5 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0"><span className="text-gold text-[10px] font-bold">i</span></span>
              {["settings", "programme", "venues", "speakers"].includes(activeTab)
                ? <span>完成所有修改後，至「設定」點擊「重新發布」更新公開網站</span>
                : <span><span className="text-gold">❶</span> 修改後點擊「儲存變更」儲存資料　<span className="text-gold">❷</span> 完成所有修改後，至「設定」點擊「重新發布」更新公開網站</span>
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!["settings", "programme", "venues", "speakers"].includes(activeTab) && <button disabled={topSaving} onClick={() => {
              const btn = document.querySelector("[data-section-save]") as HTMLButtonElement;
              if (btn) {
                setTopSaving(true);
                btn.click();
              }
            }} className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center gap-2">
              {topSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {topSaving ? "儲存中..." : "儲存變更"}
            </button>}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-8">
          {/* Section toggle bar */}
          {activeTab !== "settings" && activeTab !== "styles" && activeTab !== "appearance" && (
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
              {activeTab === "appearance" && siteId && <AppearancePanel siteId={siteId} onToast={showToast} />}
              {activeTab === "description" && siteId && <DescriptionPanel siteId={siteId} onToast={showToast} />}
              {activeTab === "tour" && siteId && <TourPanel siteId={siteId} onToast={showToast} />}
              {activeTab === "programme" && siteId && <ProgrammePanel siteId={siteId} onToast={showToast} />}
              {activeTab === "venues" && siteId && <VenuesPanel siteId={siteId} onToast={showToast} />}
              {activeTab === "speakers" && siteId && <SpeakersPanel siteId={siteId} onToast={showToast} />}
              {activeTab === "registration" && siteId && <RegistrationSettingsPanel siteId={siteId} onToast={showToast} />}
              {activeTab === "styles" && <StylesPanel siteSlug={siteSlug} onToast={showToast} />}
              {activeTab === "settings" && siteId && <SettingsPanel siteId={siteId} siteSlug={siteSlug} onToast={showToast} />}
            </>
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toast && <Toast key={toastKey} message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
