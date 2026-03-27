import { notFound } from "next/navigation";
import { getSiteBySlug, getSiteDays, getSiteSpeakers, getSiteSettings } from "@/lib/queries";
import HomePage from "./HomePage";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  const [days, speakers, settings] = await Promise.all([
    getSiteDays(site.id),
    getSiteSpeakers(site.id),
    getSiteSettings(site.id),
  ]);

  const serializedDays = JSON.parse(JSON.stringify(days));
  const serializedSpeakers = JSON.parse(JSON.stringify(speakers));

  return (
    <HomePage
      days={serializedDays}
      speakers={serializedSpeakers}
      settings={settings}
      siteName={site.name}
    />
  );
}
