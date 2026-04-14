"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSiteBySlug, getSiteDays, getSiteSpeakers, getSiteSettings, getSiteVenues, getSiteExhibitions } from "@/lib/pb-queries";
import HomePage from "./HomePage";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(slug: string) {
  try {
    const raw = localStorage.getItem(`site_${slug}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCache(slug: string, data: any) {
  try {
    localStorage.setItem(`site_${slug}`, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export default function PublicPageClient() {
  const pathname = usePathname();
  const router = useRouter();
  const slug = pathname === "/" ? null : pathname.replace(/^\//, "").split("/")[0];
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (slug: string) => {
    try {
      const site = await getSiteBySlug(slug);
      if (site.status === "draft") {
        setData({ site, days: [], speakers: [], settings: {}, venues: [], exhibitions: [] });
        setLoading(false);
        return;
      }
      const settings = await getSiteSettings(site.id);
      const days = await getSiteDays(site.id);
      const speakers = await getSiteSpeakers(site.id);
      const venues = await getSiteVenues(site.id);
      const exhibitions = await getSiteExhibitions(site.id);
      const full = { site, days, speakers, settings, venues, exhibitions };
      setData(full);
      setCache(slug, full);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load site:", err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!slug) {
      router.replace("/symposium");
      return;
    }

    // Try cache first for instant render
    const cached = getCached(slug);
    if (cached) {
      setData(cached);
      setLoading(false);
    }

    // Fetch fresh data
    fetchAll(slug);
  }, [slug, router, fetchAll]);

  if (!slug || loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#9B7B2F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.site?.status === "draft") {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="text-[#5A554B]">{data?.site?.status === "draft" ? "此網站尚未發布" : "找不到此網站"}</p>
      </div>
    );
  }

  return (
    <HomePage
      days={data.days}
      speakers={data.speakers}
      settings={data.settings}
      siteName={data.site.name}
      slug={slug}
      exhibitions={data.exhibitions}
      venues={data.venues}
    />
  );
}
