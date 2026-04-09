"use client";

import { useParams } from "next/navigation";
import SiteDashboard from "../SiteDashboardClient";

export default function SiteAdminClient() {
  const params = useParams();
  const slug = params.slug as string;

  return <SiteDashboard slugOverride={slug} />;
}
