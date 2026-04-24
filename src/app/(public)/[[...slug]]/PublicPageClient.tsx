"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSiteBySlug, getSiteDays, getSiteSpeakers, getSiteSettings, getSiteVenues, getSiteExhibitions, getSiteCssVariables, currentBackend } from "@/lib/db";
import HomePage from "./HomePage";

export default function PublicPageClient({ preloadedData }: { preloadedData?: any }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>}>
      <PublicPageInner preloadedData={preloadedData} />
    </Suspense>
  );
}

function PublicPageInner({ preloadedData }: { preloadedData?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
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
      const cssVariables = await getSiteCssVariables(site.id);
      setData({ site, days, speakers, settings, venues, exhibitions, cssVariables });
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

    // Preview mode or no preloaded data → fetch client-side
    if (isPreview || !preloadedData) {
      fetchAll(slug);
    }
  }, [slug, router, fetchAll, preloadedData, isPreview]);

  if (!slug || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || (!isPreview && data.site?.status === "draft")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted">{data?.site?.status === "draft" ? "此網站尚未發布" : "找不到此網站"}</p>
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
      cssVariables={data.cssVariables}
    />
  );
}
