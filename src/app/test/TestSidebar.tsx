"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const options = [
  { href: "/test/option-a", num: "一", title: "Simple Cover" },
  { href: "/test/option-b", num: "二", title: "Text Overlay" },
  { href: "/test/option-c", num: "三", title: "Parallax" },
  { href: "/test/option-d", num: "四", title: "Fade-in Reveal" },
];

export default function TestSidebar() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-1/2 -translate-y-1/2 z-[999] flex flex-col gap-2 pl-4">
      {options.map((opt) => {
        const active = pathname === opt.href;
        return (
          <Link
            key={opt.href}
            href={opt.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-r-lg text-sm font-inter transition-all backdrop-blur-md ${
              active
                ? "bg-gold/90 text-white shadow-lg pr-5"
                : "bg-black/50 text-white/80 hover:bg-black/70 hover:text-white hover:pr-5"
            }`}
          >
            <span className="font-serif font-bold">{opt.num}</span>
            <span className="whitespace-nowrap">{opt.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
