import type { Metadata } from "next";
import { fetchSiteDataForBuild } from "@/lib/db-server";
import PublicPageClient from "./PublicPageClient";

// Render at request time so admin saves are immediately visible.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const siteSlug = slug?.[0] || "symposium";
  try {
    const data = await fetchSiteDataForBuild(siteSlug);
    const s = data.settings;
    const title = s.og_title || data.site.name || "研討會";
    const description = s.og_description || "";

    // Resolve og_image to absolute URL
    let ogImage = s.og_image || "";
    if (ogImage && !ogImage.startsWith("http")) {
      const siteOrigin = data.site.domain
        ? `https://${data.site.domain}`
        : "https://academic-events.tzuchi.org";
      ogImage = ogImage.startsWith("/") ? `${siteOrigin}${ogImage}` : `${siteOrigin}/${ogImage}`;
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: ogImage ? [{ url: ogImage }] : [],
        siteName: title,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ogImage ? [ogImage] : [],
      },
      icons: s.favicon ? { icon: s.favicon } : undefined,
    };
  } catch {
    return { title: "研討會" };
  }
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const siteSlug = slug?.[0] || "symposium";

  let preloadedData = null;
  try {
    preloadedData = await fetchSiteDataForBuild(siteSlug);
  } catch (e) {
    console.error("Failed to fetch site data:", e);
  }

  return <PublicPageClient preloadedData={preloadedData} />;
}
