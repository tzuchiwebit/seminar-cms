import PocketBase from "pocketbase";
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

export default function Page() {
  return <PublicPageClient />;
}
