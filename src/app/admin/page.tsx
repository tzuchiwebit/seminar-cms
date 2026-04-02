"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Globe,
  Search,
  Plus,
  LayoutTemplate,
  Users,
  BarChart3,
  Image,
  X,
  Trash2,
  LogOut,
  ArrowUpDown,
} from "lucide-react";

type Site = {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    speakers: number;
    days: number;
    registrations: number;
  };
};

type UserItem = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  emailVerified: string | null;
};

type Tab = "sites" | "users";

const sideNav: { label: string; key: Tab; icon: typeof Globe }[] = [
  { label: "網站管理", key: "sites", icon: Globe },
  { label: "使用者", key: "users", icon: Users },
];

type Filter = "All Websites" | "published" | "draft";

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "剛剛";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  const weeks = Math.floor(days / 7);
  return `${weeks} 週前`;
}

export default function AllWebsitesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("sites");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<Site | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>("All Websites");
  const [search, setSearch] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formStatus, setFormStatus] = useState("draft");
  const [formLang, setFormLang] = useState("both");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fallbackSites: Site[] = [
    {
      id: 0,
      name: "全球共善學思會",
      slug: "symposium",
      domain: null,
      status: "published",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: new Date().toISOString(),
      _count: { speakers: 8, days: 3, registrations: 247 },
    },
  ];

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch("/api/sites");
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          setSites(data.length > 0 ? data : fallbackSites);
          return;
        }
      }
      setSites(fallbackSites);
    } catch {
      setSites(fallbackSites);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
    fetch("/api/users").then(r => r.ok ? r.json() : []).then(setUsers).catch(() => {});
  }, [fetchSites]);

  const handleCreate = async () => {
    if (!formName || !formSlug) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          slug: formSlug,
          domain: null,
          status: formStatus,
        }),
      });
      if (res.ok) {
        // Save start/end date as site settings if provided
        const site = await res.json();
        const settingsPairs = [];
        if (formStartDate) settingsPairs.push({ key: "eventStartDate", value: formStartDate });
        if (formEndDate) settingsPairs.push({ key: "eventEndDate", value: formEndDate });
        settingsPairs.push({ key: "site_language", value: formLang });
        for (const s of settingsPairs) {
          await fetch(`/api/sites/${site.id}/settings`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(s),
          });
        }
        setShowCreateModal(false);
        resetForm();
        fetchSites();
      }
    } catch (err) {
      console.error("Failed to create site:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (site: Site) => {
    try {
      const res = await fetch(`/api/sites/${site.id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteModal(null);
        fetchSites();
      }
    } catch (err) {
      console.error("Failed to delete site:", err);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormSlug("");
    setFormStatus("draft");
    setFormLang("both");
    setFormStartDate("");
    setFormEndDate("");
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setFormName(value);
    const slug = value
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormSlug(slug);
  };

  // Filter and search
  const filtered = sites.filter((site) => {
    if (activeFilter !== "All Websites" && site.status !== activeFilter) return false;
    if (search && !site.name.toLowerCase().includes(search.toLowerCase()) && !site.slug.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: sites.length,
    published: sites.filter((s) => s.status === "published").length,
    draft: sites.filter((s) => s.status === "draft").length,
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className="w-[220px] bg-sidebar fixed left-0 top-0 bottom-0 flex flex-col z-50">
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-white font-serif text-lg">
              善
            </div>
            <div>
              <div className="text-white font-medium text-sm">慈濟 CMS</div>
              <div className="text-white/40 text-xs">
                網站管理平台
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <ul className="space-y-0.5">
            {sideNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors relative ${
                      isActive
                        ? "text-gold bg-white/5"
                        : "text-white/60 hover:text-white/90 hover:bg-white/5"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold rounded-r" />
                    )}
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            {session?.user?.image ? (
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gold/80 flex items-center justify-center text-white text-sm font-medium shrink-0">
                {session?.user?.name?.charAt(0) || "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-white text-sm truncate">{session?.user?.name || "使用者"}</div>
              <div className="text-white/40 text-xs truncate">{session?.user?.email || ""}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="p-1.5 text-white/40 hover:text-white transition-colors"
              title="登出"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[220px] flex-1 p-8">
        {activeTab === "users" ? (
          <UsersPanel users={users} />
        ) : activeTab !== "sites" ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-muted">
            <p className="text-lg font-medium">即將推出</p>
            <p className="text-sm mt-1">此功能正在開發中</p>
          </div>
        ) : (
        <>
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-dark">網站管理</h1>
            <p className="text-sm text-muted mt-1">
              在這裡管理所有活動網站
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="搜尋網站..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm outline-none bg-transparent w-40"
              />
            </div>
            <button
              onClick={() => { resetForm(); setShowCreateModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors"
            >
              <Plus className="w-4 h-4" />
              建立網站
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-6 mb-6 border-b border-border">
          {([
            { key: "All Websites" as Filter, label: "所有網站", count: counts.all },
            { key: "published" as Filter, label: "已發布", count: counts.published },
            { key: "draft" as Filter, label: "草稿", count: counts.draft },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px ${
                activeFilter === tab.key
                  ? "border-gold text-gold"
                  : "border-transparent text-muted hover:text-dark"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs bg-cream-dark rounded-full px-1.5 py-0.5">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Websites Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center text-muted">
            載入中...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <Globe className="w-10 h-10 text-muted-light/40 mx-auto mb-3" />
            <p className="text-muted font-medium">尚無網站</p>
            <p className="text-sm text-muted-light mt-1">建立您的第一個活動網站</p>
            <button
              onClick={() => { resetForm(); setShowCreateModal(true); }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors"
            >
              <Plus className="w-4 h-4" />
              建立網站
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted uppercase tracking-wider bg-cream/50">
                  <th className="px-6 py-3 font-medium">網站</th>
                  <th className="px-6 py-3 font-medium">狀態</th>
                  <th className="px-6 py-3 font-medium">最後更新</th>
                  <th className="px-6 py-3 font-medium">講者</th>
                  <th className="px-6 py-3 font-medium">報名</th>
                  <th className="px-6 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((site) => (
                  <tr key={site.id} className="hover:bg-cream/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center text-white font-serif text-sm shrink-0">
                          {site.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-dark">
                            {site.name}
                          </p>
                          <p className="text-xs text-muted">/{site.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          site.status === "published"
                            ? "bg-green/10 text-green"
                            : "bg-muted/10 text-muted"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            site.status === "published"
                              ? "bg-green"
                              : "bg-muted"
                          }`}
                        />
                        {site.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {timeAgo(site.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {site._count.speakers}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {site._count.registrations}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/${site.slug}`}
                          className="px-3 py-1.5 text-sm text-dark border border-border rounded-md hover:bg-cream transition-colors"
                        >
                          編輯
                        </Link>
                        <Link
                          href={`/${site.slug}`}
                          className="px-3 py-1.5 text-sm text-dark border border-border rounded-md hover:bg-cream transition-colors"
                        >
                          預覽
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal(site)}
                          className="p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>
        )}
      </main>

      {/* Create Website Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-dark/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-border shadow-2xl w-full max-w-3xl mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-8 py-5 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-dark">建立新網站</h2>
                <p className="text-sm text-muted mt-0.5">設定一個新的活動網站</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-muted hover:text-dark rounded-lg hover:bg-cream transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">網站名稱</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. 慈濟年度感恩會"
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">狀態</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-colors bg-white"
                  >
                    <option value="draft">草稿</option>
                    <option value="published">已發布</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">網址路徑</label>
                <div className="flex items-center border border-border rounded-lg overflow-hidden focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/20 transition-colors">
                  <span className="px-3.5 py-2.5 bg-cream text-sm text-muted border-r border-border shrink-0">
                    /
                  </span>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="gratitude-2026"
                    className="w-full px-3.5 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <p className="text-xs text-muted-light mt-1">此網站的公開網址路徑</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">網站語言</label>
                <select
                  value={formLang}
                  onChange={(e) => setFormLang(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-colors bg-white"
                >
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                  <option value="both">中文 + English（雙語）</option>
                </select>
                <p className="text-xs text-muted-light mt-1">決定網站顯示的語言</p>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">活動開始日期</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">活動結束日期</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-border bg-cream/30">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-muted border border-border rounded-lg hover:bg-cream transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !formName || !formSlug}
                className="px-5 py-2 text-sm font-medium text-white bg-gold rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "建立中..." : "建立網站"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-dark/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(null)}
          />
          <div className="relative bg-white rounded-2xl border border-border shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-5">
              <h2 className="text-lg font-semibold text-dark mb-2">刪除網站</h2>
              <p className="text-sm text-muted">
                確定要刪除 <strong>{showDeleteModal.name}</strong> 嗎？這將永久移除此網站的所有講者、議程、論文及報名資料。
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-cream/30">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-muted border border-border rounded-lg hover:bg-cream transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Users Panel ─── */
function UsersPanel({ users }: { users: UserItem[] }) {
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...users].sort((a, b) => {
    const nameA = (a.name || a.email || "").toLowerCase();
    const nameB = (b.name || b.email || "").toLowerCase();
    return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-dark">使用者管理</h1>
        <p className="text-sm text-muted mt-1">已登入的帳號列表</p>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted uppercase tracking-wider bg-cream/50">
              <th className="px-6 py-3 font-medium">
                <button
                  onClick={() => setSortAsc(!sortAsc)}
                  className="flex items-center gap-1.5 hover:text-dark transition-colors"
                >
                  使用者
                  <span className="inline-flex items-center gap-0.5 ml-1">
                      <span className={`text-[9px] ${sortAsc ? "text-dark" : "text-muted/30"}`}>▲</span>
                      <span className={`text-[9px] ${!sortAsc ? "text-dark" : "text-muted/30"}`}>▼</span>
                    </span>
                </button>
              </th>
              <th className="px-6 py-3 font-medium">
                <button
                  onClick={() => setSortAsc(!sortAsc)}
                  className="flex items-center gap-1.5 hover:text-dark transition-colors"
                >
                  名稱
                  <span className="inline-flex items-center gap-0.5 ml-1">
                      <span className={`text-[9px] ${sortAsc ? "text-dark" : "text-muted/30"}`}>▲</span>
                      <span className={`text-[9px] ${!sortAsc ? "text-dark" : "text-muted/30"}`}>▼</span>
                    </span>
                </button>
              </th>
              <th className="px-6 py-3 font-medium">角色</th>
              <th className="px-6 py-3 font-medium">登入方式</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted">
                  尚無使用者
                </td>
              </tr>
            ) : (
              sorted.map((user) => (
                <tr key={user.id} className="hover:bg-cream/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img src={user.image} alt="" className="w-9 h-9 rounded-full shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gold/80 flex items-center justify-center text-white text-sm font-medium shrink-0">
                          {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-dark">{user.name || "—"}</p>
                        <p className="text-xs text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-dark">
                    {user.name || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold/10 text-gold capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {user.image ? "Google" : "密碼"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
