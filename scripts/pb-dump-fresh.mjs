// Fresh dump of PocketBase collections to scripts/pb-dump/*.json.
// Used as input for drust-mirror-all.mjs to sync Drust to match PB 100%.

import fs from "node:fs";
import path from "node:path";

const PB = "https://academic-events.pockethost.io";
const COLLECTIONS = [
  "sites",
  "speakers",
  "days",
  "sessions",
  "session_speakers",
  "papers",
  "venues",
  "exhibitions",
  "registrations",
  "site_settings",
  "css_variables",
];

const OUT_DIR = "scripts/pb-dump";

async function fetchAll(collection) {
  let page = 1;
  let totalItems = 0;
  const items = [];
  while (true) {
    const res = await fetch(`${PB}/api/collections/${collection}/records?perPage=500&page=${page}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${collection} ${res.status}: ${text.slice(0, 200)}`);
    }
    const j = await res.json();
    items.push(...j.items);
    totalItems = j.totalItems;
    if (items.length >= j.totalItems) break;
    page++;
  }
  return { items, totalItems, page: 1, perPage: 500, totalPages: 1 };
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const col of COLLECTIONS) {
    process.stdout.write(`  ${col.padEnd(20)} ... `);
    try {
      const data = await fetchAll(col);
      fs.writeFileSync(path.join(OUT_DIR, `${col}.json`), JSON.stringify(data, null, 2));
      console.log(`ok (${data.totalItems} records)`);
    } catch (e) {
      console.log(`FAIL: ${e.message}`);
    }
  }
  console.log("\nDone. Run scripts/drust-mirror-all.mjs to sync Drust.");
}

main().catch((e) => { console.error(e); process.exit(1); });
