"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import TestSidebar from "../TestSidebar";

export default function OptionB() {
  return (
    <div>
      <TestSidebar />
      {/* Navbar — transparent on top of banner */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/50 to-transparent">
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

      {/* Hero Banner — Full viewport with text overlay */}
      <section className="relative w-full h-screen">
        <img
          src="/img/about-banner.jpg"
          alt="Applied Buddhism and Contemporary Bodhisattva Path"
          className="w-full h-full object-cover"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Text content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-20 pb-24">
          <div className="mx-auto max-w-7xl">
            <p className="font-inter text-gold-light text-sm font-semibold tracking-[0.25em] uppercase mb-4">
              May 7 – 9, 2026 · Harvard University
            </p>
            <h1 className="font-serif text-white text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 max-w-4xl">
              應用佛學與當代
              <br />
              菩薩道的實踐
            </h1>
            <p className="font-inter text-white/70 text-lg md:text-xl max-w-2xl leading-relaxed">
              Applied Buddhism and Contemporary Bodhisattva Path: Exploring the Future of Buddhism
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
          <ChevronDown className="w-5 h-5 text-white/60" />
        </div>
      </section>

      {/* Sample content below */}
      <section className="bg-white py-24 px-6 md:px-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-inter text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Option B</p>
          <h2 className="font-serif text-dark text-5xl font-bold mb-6">Text Overlay with Gradient</h2>
          <p className="text-muted text-lg leading-relaxed max-w-2xl mx-auto">
            Full-viewport banner with a transparent navbar that blends into the image.
            A bottom gradient overlay provides contrast for the event title, date, and tagline.
            This is the classic conference/event website pattern.
          </p>
          <Link href="/test" className="inline-block mt-10 text-gold hover:underline font-inter text-sm">← Back to test index</Link>
        </div>
      </section>
    </div>
  );
}
