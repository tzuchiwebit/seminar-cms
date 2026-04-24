// Server/build-time data fetching. Picks backend same as db.ts (NEXT_PUBLIC_DB_BACKEND).
// When backend=drust, falls back to PocketBase if Drust read fails (network/5xx),
// so the public page degrades gracefully instead of erroring out.

import { fetchSiteDataForBuild as pbFetch } from "./pb-server";
import { fetchSiteDataForBuild as drustFetch } from "./drust-queries";

const BACKEND = process.env.NEXT_PUBLIC_DB_BACKEND === "drust" ? "drust" : "pb";

async function drustWithFallback(slug: string) {
  try {
    return await drustFetch(slug);
  } catch (e) {
    console.warn(`[db-server] Drust fetchSiteDataForBuild(${slug}) failed, falling back to PocketBase:`, (e as Error).message);
    return pbFetch(slug);
  }
}

export const fetchSiteDataForBuild = BACKEND === "drust" ? drustWithFallback : pbFetch;
export const currentBackend = BACKEND;
