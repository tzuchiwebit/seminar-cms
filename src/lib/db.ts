// Unified data-layer entry point.
// Picks PocketBase or Drust implementation based on NEXT_PUBLIC_DB_BACKEND.
//
//   NEXT_PUBLIC_DB_BACKEND=pb     → existing PocketBase (default; current prod)
//   NEXT_PUBLIC_DB_BACKEND=drust  → Drust via /api/drust proxy (or direct on server)
//
// Component code should import from "@/lib/db" instead of "@/lib/pb-queries"
// to make the backend swappable via env flag with zero code change.

import * as pb from "./pb-queries";
import * as drust from "./drust-queries";

type Backend = "pb" | "drust";

const BACKEND: Backend = (process.env.NEXT_PUBLIC_DB_BACKEND === "drust" ? "drust" : "pb");

const impl = BACKEND === "drust" ? drust : pb;

export const getSiteBySlug = impl.getSiteBySlug;
export const getSiteSettings = impl.getSiteSettings;
export const getSiteDays = impl.getSiteDays;
export const getSiteSpeakers = impl.getSiteSpeakers;
export const getSiteVenues = impl.getSiteVenues;
export const getSiteExhibitions = impl.getSiteExhibitions;
export const getSiteRegistrations = impl.getSiteRegistrations;

export const currentBackend: Backend = BACKEND;
