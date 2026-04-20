import PocketBase from "pocketbase";
import { fetchSiteDataForBuild } from "@/lib/pb-server";
import PublicPageClient from "./PublicPageClient";

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
