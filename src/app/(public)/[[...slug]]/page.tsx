import PublicPageClient from "./PublicPageClient";

export function generateStaticParams() {
  return [{ slug: [] }];
}

export default function Page() {
  return <PublicPageClient />;
}
