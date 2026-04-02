"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import TestSidebar from "../TestSidebar";

export default function OptionA() {
  return (
    <div>
      <TestSidebar />
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-cream border-b border-border">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
          <Link href="/test" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-gold flex items-center justify-center">
              <span className="font-serif text-gold text-lg font-bold leading-none">善</span>
            </div>
            <span className="font-inter text-sm font-medium tracking-wide text-dark hidden sm:inline">
              慈濟全球共善學思會
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {["關於", "展覽", "議程", "導覽", "地點", "講者"].map((label) => (
              <span key={label} className="font-inter text-sm text-muted hover:text-dark transition-colors cursor-pointer">
                {label}
              </span>
            ))}
          </nav>
          <div className="flex items-center bg-cream-dark rounded-full p-0.5 border border-border">
            <span className="font-inter text-xs font-medium px-3.5 py-1.5 rounded-full bg-dark text-cream shadow-sm">中文</span>
            <span className="font-inter text-xs font-medium px-3.5 py-1.5 rounded-full text-muted">EN</span>
          </div>
        </div>
      </header>

      {/* Hero Banner — Full viewport, image cover */}
      <section className="relative w-full h-[calc(100vh-64px)]">
        <img
          src="/img/about-banner.jpg"
          alt="Applied Buddhism and Contemporary Bodhisattva Path"
          className="w-full h-full object-cover"
        />

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/80 text-xs font-inter tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5 text-white/80" />
        </div>
      </section>

      {/* Sample content below */}
      <section className="bg-white py-24 px-6 md:px-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-inter text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Option A</p>
          <h2 className="font-serif text-dark text-5xl font-bold mb-6">Simple Full-Viewport Cover</h2>
          <p className="text-muted text-lg leading-relaxed max-w-2xl mx-auto">
            The banner image fills the entire viewport height using <code className="bg-cream-dark px-2 py-0.5 rounded text-sm">object-cover</code>.
            Clean and minimal — only the navbar and banner are visible on first load.
            A subtle bouncing scroll indicator hints there&apos;s more content below.
          </p>
          <Link href="/test" className="inline-block mt-10 text-gold hover:underline font-inter text-sm">← Back to test index</Link>
        </div>
      </section>
    </div>
  );
}
