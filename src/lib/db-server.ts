// Server/build-time data fetching. Picks backend same as db.ts (NEXT_PUBLIC_DB_BACKEND).
// When backend=drust, falls back to PocketBase if Drust read fails (network/5xx),
// so the public page degrades gracefully instead of erroring out.

import {
  fetchSiteDataForBuild as pbFetch,
  getDefaultPublishedSlug as pbGetDefault,
} from "./pb-server";
import {
  fetchSiteDataForBuild as drustFetch,
  getDefaultPublishedSlug as drustGetDefault,
} from "./drust-queries";

const BACKEND = process.env.NEXT_PUBLIC_DB_BACKEND === "drust" ? "drust" : "pb";

async function drustWithFallback(slug: string) {
  try {
    return await drustFetch(slug);
  } catch (e) {
    console.warn(`[db-server] Drust fetchSiteDataForBuild(${slug}) failed, falling back to PocketBase:`, (e as Error).message);
    return pbFetch(slug);
  }
}

async function drustDefaultWithFallback(): Promise<string | null> {
  try {
    return await drustGetDefault();
  } catch (e) {
    console.warn(`[db-server] Drust getDefaultPublishedSlug failed, falling back to PocketBase:`, (e as Error).message);
    return pbGetDefault();
  }
}

export const fetchSiteDataForBuild = BACKEND === "drust" ? drustWithFallback : pbFetch;
export const getDefaultPublishedSlug = BACKEND === "drust" ? drustDefaultWithFallback : pbGetDefault;
export const currentBackend = BACKEND;
