"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import TestSidebar from "../TestSidebar";

export default function OptionC() {
  return (
    <div>
      <TestSidebar />
      {/* Navbar — transparent, fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/40 to-transparent">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
          <Link href="/test" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-white/60 flex items-center justify-center">
              <span className="font-serif text-white text-lg font-bold leading-none">善</span>
            </div>
            <span className="font-inter text-sm font-medium tracking-wide text-white hidden sm:inline">
              慈濟全球共善學思會
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {["關於", "展覽", "議程", "導覽", "地點", "講者"].map((label) => (
              <span key={label} className="font-inter text-sm text-white/80 hover:text-white transition-colors cursor-pointer">
                {label}
              </span>
            ))}
          </nav>
          <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full p-0.5 border border-white/20">
            <span className="font-inter text-xs font-medium px-3.5 py-1.5 rounded-full bg-white text-dark shadow-sm">中文</span>
            <span className="font-inter text-xs font-medium px-3.5 py-1.5 rounded-full text-white/80">EN</span>
          </div>
        </div>
      </header>

      {/* Hero Banner — Parallax fixed background */}
      <section className="relative w-full h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('/img/about-banner.jpg')" }}
        />

        {/* Subtle dark overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Centered content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <p className="font-inter text-white/60 text-xs tracking-[0.4em] uppercase mb-6">
            Tzu Chi Global Symposium
          </p>
          <h1 className="font-serif text-white text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6">
            共善學思會
          </h1>
          <div className="w-16 h-px bg-gold mb-6" />
          <p className="font-inter text-white/70 text-base md:text-lg max-w-xl leading-relaxed">
            May 7 – 9, 2026 · Harvard University
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce z-10">
          <span className="text-white/50 text-[10px] font-inter tracking-[0.3em] uppercase">Explore</span>
          <ChevronDown className="w-5 h-5 text-white/50" />
        </div>
      </section>

      {/* Content scrolls over the parallax — elevated look */}
      <section className="relative z-20 bg-white py-24 px-6 md:px-20 shadow-[0_-20px_60px_rgba(0,0,0,0.15)]">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-inter text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Option C</p>
          <h2 className="font-serif text-dark text-5xl font-bold mb-6">Parallax Effect</h2>
          <p className="text-muted text-lg leading-relaxed max-w-2xl mx-auto">
            The banner image stays fixed while content scrolls over it, creating a depth/parallax effect.
            Centered event title with minimal typography. The content section casts a shadow as it slides over the hero.
          </p>
          <Link href="/test" className="inline-block mt-10 text-gold hover:underline font-inter text-sm">← Back to test index</Link>
        </div>
      </section>

      {/* Extra scroll content to show parallax */}
      <section className="relative z-20 bg-cream py-24 px-6 md:px-20">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="font-serif text-dark text-3xl font-bold mb-4">More Content Here</h3>
          <p className="text-muted leading-relaxed">
            As you scroll through these sections, notice how the banner image stays fixed behind, creating
            a layered depth effect. This works especially well with rich photography.
          </p>
        </div>
      </section>
    </div>
  );
}
