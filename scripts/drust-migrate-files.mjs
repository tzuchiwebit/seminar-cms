// Migrate file storage from PocketBase to Drust Garage.
//
// Before: photo/image/logo fields hold PocketBase URLs
//   speakers.photo = "https://academic-events.pockethost.io/api/files/.../foo.jpg"
// After:  same fields hold Drust public URLs
//   speakers.photo = "https://tool.tzuchi-org.tw/public/<tenant>/<uuid>.jpg"
//
// For each record: download from PB → upload to Drust /files (visibility=public) → PATCH
// the record with the new URL. Idempotent: skips records whose URL already points at Drust.

import fs from "node:fs";

const DRUST_BASE = "https://tool.tzuchi-org.tw/drust/t/35d6eba3-a0b7-4f09-9a54-7855fdb417f1";
const TOKEN = process.env.DRUST_TOKEN || "drust_dlNsbg0x90St8s85Z6BHzfTqH3g2xh2zCwgL5oqGWPQ";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Per-collection file fields to migrate.
const TARGETS = [
  { collection: "speakers",    field: "photo" },
  { collection: "venues",      field: "image" },
  { collection: "exhibitions", field: "image" },
  { collection: "sites",       field: "logo" },
];

// ---------- Drust helpers (with retry on 429) ----------
async function rest(method, path, opts = {}) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(`${DRUST_BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${TOKEN}`, ...(opts.headers || {}) },
      body: opts.body,
    });
    if (res.status === 429) {
      const text = await res.text();
      const m = text.match(/retry after (\d+)s/i);
      const wait = m ? parseInt(m[1]) * 1000 + 200 : 2000 * attempt;
      process.stdout.write(`(429 ${path}; wait ${wait}ms) `);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${method} ${path} ${res.status}: ${text.slice(0, 200)}`);
    }
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
  }
  throw new Error(`${method} ${path}: exhausted retries`);
}

async function uploadToDrust(buffer, filename, contentType) {
  const fd = new FormData();
  const blob = new Blob([buffer], { type: contentType });
  fd.append("file", blob, filename);
  fd.append("visibility", "public");
  const res = await rest("POST", "/files", { body: fd });
  if (!res.url) throw new Error(`upload returned no url: ${JSON.stringify(res).slice(0, 200)}`);
  return res.url;
}

function filenameFromUrl(url) {
  try {
    return new URL(url).pathname.split("/").pop() || "file";
  } catch { return "file"; }
}

// ---------- Per-collection migration ----------
async function migrateCollection(collection, field) {
  console.log(`\n=== ${collection}.${field} ===`);
  // Read all records with non-empty field
  const sql = `SELECT id, pb_id, "${field}" AS url FROM "${collection}" WHERE "${field}" IS NOT NULL AND "${field}" != ''`;
  const q = await rest("POST", "/query", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  });
  const rows = (q.rows || []).map((r) => ({ id: r[0], pb_id: r[1], url: r[2] }));
  console.log(`  ${rows.length} records have ${field}`);

  let migrated = 0, skipped = 0, failed = 0;
  for (const r of rows) {
    if (typeof r.url !== "string" || !r.url) { skipped++; continue; }
    if (r.url.startsWith(DRUST_BASE) || r.url.includes("tool.tzuchi-org.tw/public/")) {
      skipped++;
      continue;
    }
    try {
      const dl = await fetch(r.url);
      if (!dl.ok) throw new Error(`download ${dl.status}`);
      const buf = Buffer.from(await dl.arrayBuffer());
      const ct = dl.headers.get("content-type") || "application/octet-stream";
      const fname = filenameFromUrl(r.url);
      const newUrl = await uploadToDrust(buf, fname, ct);
      await rest("PATCH", `/records/${collection}/${r.id}`, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { [field]: newUrl } }),
      });
      migrated++;
      process.stdout.write(`  ✓ ${collection}/${r.pb_id} → ${newUrl.slice(-40)}\n`);
    } catch (e) {
      failed++;
      console.log(`  ✗ ${collection}/${r.pb_id}: ${e.message}`);
    }
    await sleep(200); // pacing for rate limit
  }
  console.log(`  done: migrated=${migrated} skipped=${skipped} failed=${failed}`);
  return { migrated, skipped, failed };
}

async function main() {
  const totals = { migrated: 0, skipped: 0, failed: 0 };
  for (const t of TARGETS) {
    const r = await migrateCollection(t.collection, t.field);
    totals.migrated += r.migrated;
    totals.skipped += r.skipped;
    totals.failed += r.failed;
  }
  console.log(`\n=== TOTAL: migrated=${totals.migrated}, skipped=${totals.skipped}, failed=${totals.failed} ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
