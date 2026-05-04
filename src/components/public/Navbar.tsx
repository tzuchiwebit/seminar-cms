"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Navbar({ slug, lang, settings }: { slug: string; lang: "zh" | "en"; settings: Record<string, string> }) {
  const base = `/${slug}`;

  const otherLabelZh = (settings.section_other_title_zh || "").trim() || "其他";
  const otherLabelEn = (settings.section_other_title_en || "").trim() || "Other";

  const allLinks =
    lang === "zh"
      ? [
          { href: `${base}#description`, label: "關於", section: "description", anchor: "description" },
          { href: `${base}#tour`, label: "展覽", section: "tour", anchor: "tour" },
          { href: `${base}#programme`, label: "議程", section: "programme", anchor: "programme" },
          { href: `${base}#venue`, label: "地點", section: "venues", anchor: "venue" },
          { href: `${base}#speakers`, label: "講者", section: "speakers", anchor: "speakers" },
          { href: `${base}#other`, label: otherLabelZh, section: "other", anchor: "other" },
        ]
      : [
          { href: `${base}#description`, label: "About", section: "description", anchor: "description" },
          { href: `${base}#tour`, label: "Exhibition", section: "tour", anchor: "tour" },
          { href: `${base}#programme`, label: "Programme", section: "programme", anchor: "programme" },
          { href: `${base}#venue`, label: "Venue", section: "venues", anchor: "venue" },
          { href: `${base}#speakers`, label: "Speakers", section: "speakers", anchor: "speakers" },
          { href: `${base}#other`, label: otherLabelEn, section: "other", anchor: "other" },
        ];

  const navLinks = allLinks.filter(
    (link) => settings[`section_${link.section}_visible`] !== "false"
  );

  const linkFont =
    lang === "en"
      ? "text-[10px] md:text-[12px] lg:text-[14px] tracking-[0.04em] md:tracking-[0.06em] lg:tracking-[0.08em]"
      : "text-[12px] md:text-[13px] lg:text-[14px] tracking-[0.04em] md:tracking-[0.08em]";

  const scrollerRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);

  // Track which section is currently in view via IntersectionObserver
  useEffect(() => {
    const sections = navLinks
      .map((l) => document.getElementById(l.anchor))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveAnchor(visible[0].target.id);
        }
      },
      {
        // Trigger when a section's middle crosses the navbar bottom
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [navLinks.length]);

  // Scroll the active link into the visible part of the navbar (mobile)
  useEffect(() => {
    if (!activeAnchor) return;
    const el = linkRefs.current[activeAnchor];
    const scroller = scrollerRef.current;
    if (!el || !scroller) return;
    const elRect = el.getBoundingClientRect();
    const sRect = scroller.getBoundingClientRect();
    if (elRect.left < sRect.left + 24 || elRect.right > sRect.right - 24) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeAnchor]);

  return (
    <header className="sticky top-0 z-50 bg-cream border-b border-border">
      <div className="relative">
        {/* Fade gradients — visible only on small screens where the nav can scroll */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-cream to-transparent z-10 md:hidden" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-cream to-transparent z-10 md:hidden" />

        <div
          ref={scrollerRef}
          className="mx-auto max-w-7xl flex items-center h-14 md:h-16 overflow-x-auto md:overflow-visible md:justify-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <nav className="flex items-center px-4 md:px-6 md:gap-1 lg:gap-2">
            {navLinks.map((link, i) => {
              const active = activeAnchor === link.anchor;
              return (
                <span key={link.href} className="flex items-center shrink-0">
                  <Link
                    ref={(el) => { linkRefs.current[link.anchor] = el; }}
                    href={link.href}
                    className={`block whitespace-nowrap text-center font-inter ${linkFont} uppercase font-medium px-3 md:px-3 lg:px-5 py-2 rounded-full transition-all ${active ? "text-gold bg-gold/10" : "text-muted hover:text-gold hover:bg-gold/5"}`}
                  >
                    {link.label}
                  </Link>
                  {i < navLinks.length - 1 && (
                    <span className="w-1 h-1 rounded-full bg-gold/40 md:bg-gold/20 shrink-0 mx-1 md:mx-0 md:hidden lg:block" />
                  )}
                </span>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
