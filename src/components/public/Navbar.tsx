"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar({ slug, lang, settings }: { slug: string; lang: "zh" | "en"; settings: Record<string, string> }) {
  const [mobileOpen, setMobileOpen] = useState(false);
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

  return (
    <header className="sticky top-0 z-50 bg-cream border-b border-border">
      <div className="mx-auto max-w-7xl px-4 md:px-6 flex items-center justify-between md:justify-center h-14 md:h-16">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-8 h-8 relative flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {/* Hamburger lines → up arrow */}
          <div className={`transition-all duration-300 ${mobileOpen ? "opacity-0 scale-75" : "opacity-100 scale-100"} flex flex-col items-center justify-center gap-1.5 absolute`}>
            <span className="block w-5 h-[2px] bg-muted" />
            <span className="block w-5 h-[2px] bg-muted" />
            <span className="block w-5 h-[2px] bg-muted" />
          </div>
          <svg className={`w-5 h-5 text-muted transition-all duration-300 ${mobileOpen ? "opacity-100 scale-100" : "opacity-0 scale-75"} absolute`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link, i) => (
            <span key={link.href} className="flex items-center">
              <Link
                href={link.href}
                className="font-inter text-[13px] lg:text-[14px] tracking-[0.08em] uppercase text-muted hover:text-gold font-medium px-3 lg:px-5 py-2 rounded-full hover:bg-gold/5 transition-all"
              >
                {link.label}
              </Link>
              {i < navLinks.length - 1 && (
                <span className="w-1 h-1 rounded-full bg-gold/20 hidden lg:block" />
              )}
            </span>
          ))}
        </nav>

        {/* Spacer for centering on mobile */}
        <div className="w-8 md:hidden" />
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}>
        <nav className="flex flex-col px-4 pb-4 gap-0.5 border-t border-border">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="font-inter text-[14px] tracking-[0.08em] uppercase text-muted hover:text-gold font-medium px-4 py-3 rounded-lg hover:bg-gold/5 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
