import PocketBase from "pocketbase";
import SiteAdminClient from "./SiteAdminClient";

export async function generateStaticParams() {
  try {
    const pb = new PocketBase(
      process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://academic-events.pockethost.io/"
    );
    const sites = await pb.collection("sites").getFullList({ fields: "slug" });
    return sites.map((site) => ({ slug: site.slug }));
  } catch {
    return [{ slug: "symposium" }];
  }
}

export default function SiteAdminPage() {
  return <SiteAdminClient />;
}
