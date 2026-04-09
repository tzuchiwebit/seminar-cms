"use client";

import { useParams } from "next/navigation";
import SiteDashboard from "../SiteDashboardClient";

export default function SiteAdminPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <SiteDashboard slugOverride={slug} />;
}
