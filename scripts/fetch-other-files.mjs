import PocketBase from "pocketbase";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PB_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  "https://academic-events.pockethost.io/";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

function parseLabel(label) {
  if (!label) return { zh: "", en: "" };
  try {
    const parsed = JSON.parse(label);
    return { zh: parsed.zh || "", en: parsed.en || "" };
  } catch {
    return { zh: label, en: label };
  }
}

function slugify(input) {
  // Lowercase, collapse whitespace/punctuation to hyphens. Keeps Chinese characters intact.
  return (
    (input || "")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9一-鿿]+/g, "-")
      .replace(/^-+|-+$/g, "") || "file"
  );
}

async function main() {
  console.log(`[fetch-other-files] Connecting to ${PB_URL}`);
  const sites = await pb.collection("sites").getFullList();
  console.log(`[fetch-other-files] Found ${sites.length} site(s)`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const site of sites) {
    let uploads = [];
    try {
      const all = await pb.collection("uploads").getFullList({
        filter: `site="${site.id}"`,
      });
      uploads = all.filter((r) => r.category === "other");
      uploads.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    } catch (err) {
      console.warn(
        `[fetch-other-files] ${site.slug}: failed to list uploads — ${err.message}`
      );
      skipped++;
      continue;
    }

    if (uploads.length === 0) {
      console.log(`[fetch-other-files] ${site.slug}: no 其他 files — skipped`);
      skipped++;
      continue;
    }

    const outDir = join(PUBLIC_DIR, site.slug);
    await mkdir(outDir, { recursive: true });

    const usedNames = new Set();

    for (const record of uploads) {
      const lbl = parseLabel(record.label);
      const base = lbl.en || lbl.zh || record.id;
      let filenameSlug = slugify(base);
      // Dedupe within same site
      let candidate = filenameSlug;
      let n = 2;
      while (usedNames.has(candidate)) {
        candidate = `${filenameSlug}-${n++}`;
      }
      filenameSlug = candidate;
      usedNames.add(filenameSlug);

      const fileUrl = pb.files.getURL(record, record.file);
      const ext = (record.file.match(/\.[^.]+$/) || [".pdf"])[0];
      const outName = `${filenameSlug}${ext}`;
      const outPath = join(outDir, outName);

      try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await writeFile(outPath, buf);
        const sizeMb = (buf.length / 1024 / 1024).toFixed(2);
        console.log(
          `[fetch-other-files] ${site.slug}/${outName} (${sizeMb} MB)`
        );
        downloaded++;
      } catch (err) {
        console.warn(
          `[fetch-other-files] ${site.slug}/${outName}: download failed — ${err.message}`
        );
        failed++;
      }
    }
  }

  console.log(
    `[fetch-other-files] Done. downloaded=${downloaded} skipped=${skipped} failed=${failed}`
  );
}

main().catch((err) => {
  console.error("[fetch-other-files] Fatal:", err);
  process.exit(0);
});
