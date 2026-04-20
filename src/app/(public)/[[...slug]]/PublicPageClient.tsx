"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSiteBySlug, getSiteDays, getSiteSpeakers, getSiteSettings, getSiteVenues, getSiteExhibitions } from "@/lib/pb-queries";
import HomePage from "./HomePage";

export default function PublicPageClient({ preloadedData }: { preloadedData?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const slug = pathname === "/" ? null : pathname.replace(/^\//, "").split("/")[0];

  // If preloaded data exists, use it immediately (no loading state)
  const [data, setData] = useState<any>(preloadedData || null);
  const [loading, setLoading] = useState(!preloadedData);

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
      setData({ site, days, speakers, settings, venues, exhibitions });
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

    // If no preloaded data, fetch client-side (dev mode fallback)
    if (!preloadedData) {
      fetchAll(slug);
    }
  }, [slug, router, fetchAll, preloadedData]);

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
