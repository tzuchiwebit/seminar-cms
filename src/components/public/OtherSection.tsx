"use client";

import { FileText } from "lucide-react";

type OtherFile = {
  id: string;
  label: string;
  url: string;
  filename: string;
};

function parseLabel(label: string): { zh: string; en: string } {
  if (!label) return { zh: "", en: "" };
  try {
    const parsed = JSON.parse(label);
    return { zh: parsed.zh || "", en: parsed.en || "" };
  } catch {
    return { zh: label, en: label };
  }
}

function slugify(input: string): string {
  // Lowercase, collapse whitespace/punctuation to hyphens. Keeps Chinese characters intact.
  return (
    input
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9一-鿿]+/g, "-")
      .replace(/^-+|-+$/g, "") || "file"
  );
}

function getFileExt(filename: string): string {
  const m = filename.match(/\.[^.]+$/);
  return m ? m[0] : ".pdf";
}

function getCleanUrl(slug: string, file: OtherFile, allFiles: OtherFile[]): string {
  // Files are mirrored to public/{slug}/{filenameSlug}{ext} by scripts/fetch-other-files.mjs
  // (auto-runs as predev / prebuild). Must match the dedupe logic in that script.
  const ext = getFileExt(file.filename);
  const used = new Set<string>();
  for (const f of allFiles) {
    const lbl = parseLabel(f.label);
    const base = lbl.en || lbl.zh || f.id;
    let candidate = slugify(base);
    let n = 2;
    while (used.has(candidate)) candidate = `${slugify(base)}-${n++}`;
    used.add(candidate);
    if (f.id === file.id) return `/${slug}/${candidate}${ext}`;
  }
  return file.url;
}

export default function OtherSection({
  files,
  titleZh,
  titleEn,
  lang,
  slug,
}: {
  files: OtherFile[];
  titleZh: string;
  titleEn: string;
  lang: "zh" | "en";
  slug: string;
}) {
  const displayTitleZh = titleZh.trim() || "其他";
  const displayTitleEn = titleEn.trim() || "Other";
  const headerPrimary = lang === "zh" ? displayTitleZh : displayTitleEn;
  const headerSecondary = lang === "zh" ? displayTitleEn : displayTitleZh;

  return (
    <section className="bg-cream px-4 md:px-20 py-12 md:py-20" id="other">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex flex-col items-center gap-2 mb-10 md:mb-14">
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-dark text-center">
            {headerPrimary}
          </h2>
          {headerSecondary && headerSecondary !== headerPrimary && (
            <p className="font-inter text-xs md:text-sm tracking-[0.18em] uppercase text-gold/80 text-center">
              {headerSecondary}
            </p>
          )}
          <div className="w-10 h-[1px] bg-gold mt-2" />
        </div>

        {files.length === 0 ? (
          <p className="text-center text-sm text-muted">
            {lang === "zh" ? "尚未上傳任何檔案" : "No files yet"}
          </p>
        ) : (
          <div className="flex flex-row flex-wrap justify-center gap-5 md:gap-6">
            {files.map((file) => {
              const lbl = parseLabel(file.label);
              const titlePrimary = lang === "zh" ? lbl.zh || lbl.en : lbl.en || lbl.zh;
              const titleSecondary = lang === "zh" ? lbl.en : lbl.zh;
              const href = getCleanUrl(slug, file, files);
              return (
                <a
                  key={file.id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-4 px-6 py-7 w-[calc(50%-12px)] sm:w-[240px] md:w-[260px] bg-white rounded-xl border border-border hover:border-gold/60 hover:shadow-xl transition-all duration-300"
                >
                  {/* File icon — gold circle */}
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gold/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-gold/20">
                    <FileText className="w-6 h-6 md:w-7 md:h-7 text-gold transition-transform duration-300 group-hover:scale-110" />
                  </div>

                  {/* Title — bilingual */}
                  <div className="flex flex-col items-center gap-1 text-center min-h-[44px] justify-center">
                    <span className="font-serif font-bold text-base md:text-lg text-dark leading-tight">
                      {titlePrimary || (lang === "zh" ? "(未命名)" : "(Untitled)")}
                    </span>
                    {titleSecondary && titleSecondary !== titlePrimary && (
                      <span className="font-inter text-[11px] md:text-xs text-muted leading-tight">
                        {titleSecondary}
                      </span>
                    )}
                  </div>

                  {/* Click to see content — bilingual */}
                  <span className="font-inter text-[11px] tracking-[0.14em] uppercase text-gold/70 group-hover:text-gold transition-colors text-center">
                    {lang === "zh" ? "點擊查看內容 ↗" : "Click to see content ↗"}
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
