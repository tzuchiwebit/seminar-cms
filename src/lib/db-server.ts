// Server/build-time data fetching. Picks backend same as db.ts (NEXT_PUBLIC_DB_BACKEND).
// Used by route-level `page.tsx` server components and generateStaticParams.

import { fetchSiteDataForBuild as pbFetch } from "./pb-server";
import { fetchSiteDataForBuild as drustFetch } from "./drust-queries";

const BACKEND = process.env.NEXT_PUBLIC_DB_BACKEND === "drust" ? "drust" : "pb";

export const fetchSiteDataForBuild = BACKEND === "drust" ? drustFetch : pbFetch;
export const currentBackend = BACKEND;
