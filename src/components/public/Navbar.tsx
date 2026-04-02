"use client";

import Link from "next/link";

export default function Navbar({ slug, lang, settings }: { slug: string; lang: "zh" | "en"; settings: Record<string, string> }) {
  const base = `/${slug}`;

  const allLinks =
    lang === "zh"
      ? [
          { href: `${base}#description`, label: "關於", section: "description" },
          { href: `${base}#exhibition`, label: "展覽", section: "exhibition" },
          { href: `${base}#programme`, label: "議程", section: "programme" },
          { href: `${base}#tour`, label: "導覽", section: "tour" },
          { href: `${base}#venue`, label: "地點", section: "venues" },
          { href: `${base}#speakers`, label: "講者", section: "speakers" },
        ]
      : [
          { href: `${base}#about`, label: "About", section: "description" },
          { href: `${base}#exhibition`, label: "Exhibition", section: "exhibition" },
          { href: `${base}#programme`, label: "Programme", section: "programme" },
          { href: `${base}#tour`, label: "Tour", section: "tour" },
          { href: `${base}#venue`, label: "Venue", section: "venues" },
          { href: `${base}#speakers`, label: "Speakers", section: "speakers" },
        ];

  const navLinks = allLinks.filter(
    (link) => settings[`section_${link.section}_visible`] !== "false"
  );

  return (
    <header className="sticky top-0 z-50 bg-[#F5F1EB] border-b border-[#E5E0D8]">
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-center h-16">
        <nav className="flex items-center gap-2">
          {navLinks.map((link, i) => (
            <span key={link.href} className="flex items-center">
              <Link
                href={link.href}
                className="font-inter text-[14px] tracking-[0.08em] uppercase text-[#5A554B] hover:text-[#9B7B2F] font-medium px-5 py-2 rounded-full hover:bg-[#9B7B2F]/5 transition-all"
              >
                {link.label}
              </Link>
              {i < navLinks.length - 1 && (
                <span className="w-1 h-1 rounded-full bg-[#9B7B2F]/20" />
              )}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
