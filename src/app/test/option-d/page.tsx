"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import TestSidebar from "../TestSidebar";

export default function OptionD() {
  const [scrollY, setScrollY] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const opacity = Math.max(0, 1 - scrollY / 600);
  const scale = 1 + scrollY * 0.0003;
  const translateY = scrollY * 0.3;

  return (
    <div>
      <TestSidebar />
      {/* Navbar — transparent, transitions to solid on scroll */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrollY > 100 ? "rgba(245,241,235,0.95)" : "transparent",
          borderBottom: scrollY > 100 ? "1px solid #E5E0D8" : "1px solid transparent",
          backdropFilter: scrollY > 100 ? "blur(12px)" : "none",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
          <Link href="/test" className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors duration-300"
              style={{ borderColor: scrollY > 100 ? "#9B7B2F" : "rgba(255,255,255,0.6)" }}
            >
              <span
                className="font-serif text-lg font-bold leading-none transition-colors duration-300"
                style={{ color: scrollY > 100 ? "#9B7B2F" : "#fff" }}
              >
                善
              </span>
            </div>
            <span
              className="font-inter text-sm font-medium tracking-wide hidden sm:inline transition-colors duration-300"
              style={{ color: scrollY > 100 ? "#1A1816" : "#fff" }}
            >
              慈濟全球共善學思會
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {["關於", "展覽", "議程", "導覽", "地點", "講者"].map((label) => (
              <span
                key={label}
                className="font-inter text-sm transition-colors duration-300 cursor-pointer"
                style={{ color: scrollY > 100 ? "#5A554B" : "rgba(255,255,255,0.8)" }}
              >
                {label}
              </span>
            ))}
          </nav>
          <div
            className="flex items-center rounded-full p-0.5 border transition-all duration-300"
            style={{
              backgroundColor: scrollY > 100 ? "#EDE8DF" : "rgba(255,255,255,0.1)",
              borderColor: scrollY > 100 ? "#E5E0D8" : "rgba(255,255,255,0.2)",
            }}
          >
            <span
              className="font-inter text-xs font-medium px-3.5 py-1.5 rounded-full shadow-sm transition-all duration-300"
              style={{
                backgroundColor: scrollY > 100 ? "#1A1816" : "#fff",
                color: scrollY > 100 ? "#F5F1EB" : "#1A1816",
              }}
            >
              中文
            </span>
            <span
              className="font-inter text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors duration-300"
              style={{ color: scrollY > 100 ? "#5A554B" : "rgba(255,255,255,0.8)" }}
            >
              EN
            </span>
          </div>
        </div>
      </header>

      {/* Hero Banner — Fade + zoom on scroll */}
      <section className="relative w-full h-screen overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-100"
          style={{ transform: `scale(${scale})` }}
        >
          <img
            src="/img/about-banner.jpg"
            alt="Applied Buddhism and Contemporary Bodhisattva Path"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />

        {/* Animated text content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          style={{ opacity, transform: `translateY(${translateY}px)` }}
        >
          {/* Staggered fade-in animations */}
          <p
            className="font-inter text-white/60 text-xs tracking-[0.4em] uppercase mb-6 transition-all duration-1000"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(20px)",
              transitionDelay: "0.3s",
            }}
          >
            May 7 – 9, 2026 · Harvard University
          </p>

          <h1
            className="font-serif text-white text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6 transition-all duration-1000"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "0.6s",
            }}
          >
            應用佛學與
            <br />
            當代菩薩道
          </h1>

          <div
            className="w-16 h-px bg-gold mb-6 transition-all duration-1000"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "scaleX(1)" : "scaleX(0)",
              transitionDelay: "0.9s",
            }}
          />

          <p
            className="font-inter text-white/70 text-base md:text-lg max-w-xl leading-relaxed transition-all duration-1000"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(20px)",
              transitionDelay: "1.2s",
            }}
          >
            Exploring the Future of Buddhism
          </p>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce"
          style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
        >
          <span className="text-white/50 text-[10px] font-inter tracking-[0.3em] uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5 text-white/50" />
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-24 px-6 md:px-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-inter text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Option D</p>
          <h2 className="font-serif text-dark text-5xl font-bold mb-6">Fade-in Reveal</h2>
          <p className="text-muted text-lg leading-relaxed max-w-2xl mx-auto">
            Text elements stagger in with fade + slide animations on page load.
            As you scroll, the banner content fades out and the image subtly zooms, creating a cinematic transition.
            The navbar transitions from transparent to solid as you scroll past the hero.
          </p>
          <Link href="/test" className="inline-block mt-10 text-gold hover:underline font-inter text-sm">← Back to test index</Link>
        </div>
      </section>
    </div>
  );
}
