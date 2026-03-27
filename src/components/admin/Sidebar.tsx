"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Image,
  MapPin,
  ClipboardList,
  Settings,
  ChevronLeft,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Speakers", href: "/admin/speakers", icon: Users },
  { label: "Programme", href: "/admin/programme", icon: Calendar },
  { label: "Papers", href: "/admin/papers", icon: FileText },
  { label: "Exhibition", href: "/admin/exhibition", icon: Image },
  { label: "Venues", href: "/admin/venues", icon: MapPin },
  { label: "Registrations", href: "/admin/registrations", icon: ClipboardList },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-sidebar flex flex-col z-50">
      {/* Back link */}
      <div className="px-5 pt-5 pb-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-white/50 text-sm hover:text-white/80 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          All Websites
        </Link>
      </div>

      {/* Site identity */}
      <div className="px-5 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-white font-serif text-lg shrink-0">
            善
          </div>
          <div className="min-w-0">
            <div className="text-white font-serif text-sm font-medium truncate">
              全球共善學思會
            </div>
            <div className="text-white/40 text-xs truncate">
              symposium.tzuchi.org
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors relative ${
                    active
                      ? "text-gold bg-white/5"
                      : "text-white/60 hover:text-white/90 hover:bg-white/5"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold rounded-r" />
                  )}
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
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
  );
}
