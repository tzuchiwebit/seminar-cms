"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar({ slug }: { slug: string }) {
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const base = `/${slug}`;

  const navLinks =
    lang === "zh"
      ? [
          { href: `${base}#description`, label: "關於" },
          { href: `${base}#exhibition`, label: "展覽" },
          { href: `${base}#programme`, label: "議程" },
          { href: `${base}#tour`, label: "導覽" },
          { href: `${base}#venue`, label: "地點" },
          { href: `${base}#speakers`, label: "講者" },
        ]
      : [
          { href: `${base}#about`, label: "About" },
          { href: `${base}#exhibition`, label: "Exhibition" },
          { href: `${base}#programme`, label: "Programme" },
          { href: `${base}#tour`, label: "Tour" },
          { href: `${base}#venue`, label: "Venue" },
          { href: `${base}#speakers`, label: "Speakers" },
        ];

  return (
    <header className="sticky top-0 z-50 bg-cream border-b border-border">
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href={base} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-gold flex items-center justify-center">
            <span className="font-serif text-gold text-lg font-bold leading-none">
              善
            </span>
          </div>
          <span className="font-inter text-sm font-medium tracking-wide text-dark hidden sm:inline">
            {lang === "zh" ? "慈濟全球共善學思會" : "Tzu Chi Global Symposium"}
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-inter text-sm text-muted hover:text-dark transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Language Toggle */}
        <div className="flex items-center bg-cream-dark rounded-full p-0.5 border border-border">
          <button
            onClick={() => setLang("zh")}
            className={`font-inter text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
              lang === "zh"
                ? "bg-dark text-cream shadow-sm"
                : "text-muted hover:text-dark"
            }`}
          >
            中文
          </button>
          <button
            onClick={() => setLang("en")}
            className={`font-inter text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
              lang === "en"
                ? "bg-dark text-cream shadow-sm"
                : "text-muted hover:text-dark"
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
}
