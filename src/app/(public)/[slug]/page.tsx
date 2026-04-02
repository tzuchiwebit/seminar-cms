"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getSiteBySlug, getSiteDays, getSiteSpeakers, getSiteSettings, getSiteVenues, getSiteExhibitions } from "@/lib/pb-queries";
import HomePage from "./HomePage";

export default function Page() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const site = await getSiteBySlug(slug);
        const [days, speakers, settings, venues, exhibitions] = await Promise.all([
          getSiteDays(site.id),
          getSiteSpeakers(site.id),
          getSiteSettings(site.id),
          getSiteVenues(site.id),
          getSiteExhibitions(site.id),
        ]);
        setData({ site, days, speakers, settings, venues, exhibitions });
      } catch (err) {
        console.error("Failed to load site:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#9B7B2F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="text-[#5A554B]">找不到此網站</p>
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
