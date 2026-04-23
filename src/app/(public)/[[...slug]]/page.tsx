import type { Metadata } from "next";
import PocketBase from "pocketbase";
import { fetchSiteDataForBuild } from "@/lib/pb-server";
import PublicPageClient from "./PublicPageClient";

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const siteSlug = slug?.[0] || "symposium";
  try {
    const data = await fetchSiteDataForBuild(siteSlug);
    const s = data.settings;
    return {
      title: s.og_title || data.site.name || "研討會",
      description: s.og_description || "",
      openGraph: {
        title: s.og_title || data.site.name,
        description: s.og_description || "",
        images: s.og_image ? [{ url: s.og_image }] : [],
        siteName: s.og_title || data.site.name,
      },
      twitter: {
        card: "summary_large_image",
        title: s.og_title || data.site.name,
        description: s.og_description || "",
        images: s.og_image ? [s.og_image] : [],
      },
      icons: s.favicon ? { icon: s.favicon } : undefined,
    };
  } catch {
    return { title: "研討會" };
  }
}

export async function generateStaticParams() {
  try {
    const pb = new PocketBase(
      process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://academic-events.pockethost.io/"
    );
    const sites = await pb.collection("sites").getFullList({ fields: "slug" });
    return [
      { slug: [] },
      ...sites.map((site) => ({ slug: [site.slug] })),
    ];
  } catch {
    return [{ slug: [] }, { slug: ["symposium"] }];
  }
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const siteSlug = slug?.[0] || "symposium";

  let preloadedData = null;
  try {
    preloadedData = await fetchSiteDataForBuild(siteSlug);
  } catch (e) {
    console.error("Failed to pre-fetch site data:", e);
  }

  return <PublicPageClient preloadedData={preloadedData} />;
}
