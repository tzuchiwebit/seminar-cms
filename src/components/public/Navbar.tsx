"use client";

import Link from "next/link";

export default function Navbar({ slug, lang, settings }: { slug: string; lang: "zh" | "en"; settings: Record<string, string> }) {
  const base = `/${slug}`;

  const allLinks =
    lang === "zh"
      ? [
          { href: `${base}#description`, label: "關於", section: "description" },
          { href: `${base}#tour`, label: "展覽", section: "tour" },
          { href: `${base}#programme`, label: "議程", section: "programme" },
          { href: `${base}#venue`, label: "地點", section: "venues" },
          { href: `${base}#speakers`, label: "講者", section: "speakers" },
        ]
      : [
          { href: `${base}#description`, label: "About", section: "description" },
          { href: `${base}#tour`, label: "Exhibition", section: "tour" },
          { href: `${base}#programme`, label: "Programme", section: "programme" },
          { href: `${base}#venue`, label: "Venue", section: "venues" },
          { href: `${base}#speakers`, label: "Speakers", section: "speakers" },
        ];

  const navLinks = allLinks.filter(
    (link) => settings[`section_${link.section}_visible`] !== "false"
  );

  // EN labels are longer than CN, so reduce font size on mobile
  const linkFont =
    lang === "en"
      ? "text-[9px] md:text-[12px] lg:text-[14px] tracking-[0.02em] md:tracking-[0.06em] lg:tracking-[0.08em]"
      : "text-[11px] md:text-[13px] lg:text-[14px] tracking-[0.04em] md:tracking-[0.08em]";

  return (
    <header className="sticky top-0 z-50 bg-cream border-b border-border">
      <div className="mx-auto max-w-7xl px-2 md:px-6 flex items-center justify-center h-14 md:h-16">
        <nav className="flex items-center w-full md:w-auto md:gap-1 lg:gap-2">
          {navLinks.map((link, i) => (
            <span key={link.href} className="flex items-center flex-1 md:flex-initial justify-center">
              <Link
                href={link.href}
                className={`block w-full md:w-auto text-center font-inter ${linkFont} uppercase text-muted hover:text-gold font-medium px-1 md:px-3 lg:px-5 py-2 rounded-full hover:bg-gold/5 transition-all`}
              >
                {link.label}
              </Link>
              {i < navLinks.length - 1 && (
                <span className="w-1 h-1 rounded-full bg-gold/40 md:bg-gold/20 shrink-0 mx-1 md:mx-0 md:hidden lg:block" />
              )}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
