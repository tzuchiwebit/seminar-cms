import type { Metadata } from "next";
import { getSiteBySlug, getSiteSettings } from "@/lib/queries";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) return {};

  const settings = await getSiteSettings(site.id);

  return {
    title: settings.og_title || settings.og_title_en || site.name,
    description: settings.og_description || settings.og_description_en || "",
    icons: settings.favicon ? { icon: settings.favicon } : undefined,
    openGraph: {
      title: settings.og_title || settings.og_title_en || site.name,
      description: settings.og_description || settings.og_description_en || "",
      images: settings.og_image ? [settings.og_image] : undefined,
    },
  };
}

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <>
      <main className="min-h-screen">{children}</main>
    </>
  );
}
