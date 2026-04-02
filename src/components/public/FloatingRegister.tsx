"use client";

export default function FloatingRegister({
  lang,
  onToggleLang,
  showLangToggle = true,
}: {
  lang: "zh" | "en";
  onToggleLang: () => void;
  showLangToggle?: boolean;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
      {/* Language Toggle — 中/EN circle design */}
      {showLangToggle && (
        <button
          onClick={onToggleLang}
          className="w-12 h-12 rounded-full border-2 border-dark/80 bg-white hover:bg-cream transition-colors flex items-center justify-center relative overflow-hidden shadow-md"
        >
          {/* Diagonal line */}
          <div className="absolute w-[1.5px] h-[70%] bg-dark/40 rotate-[30deg]" />
          {/* 中 top-left */}
          <span className={`absolute top-[7px] left-[9px] font-serif text-[13px] leading-none transition-colors ${lang === "zh" ? "text-dark font-bold" : "text-dark/30"}`}>
            中
          </span>
          {/* EN bottom-right */}
          <span className={`absolute bottom-[7px] right-[7px] font-inter text-[10px] font-semibold leading-none transition-colors ${lang === "en" ? "text-dark" : "text-dark/30"}`}>
            EN
          </span>
        </button>
      )}

      {/* Register Button */}
      <a
        href="#register"
        className="group w-[72px] h-[72px] rounded-full relative block"
      >
        <span
          className="absolute inset-0 rounded-full animate-[spin_3s_linear_infinite]"
          style={{
            background:
              "conic-gradient(from 0deg, #1A1816 0%, #1A1816 50%, #9B7B2F 65%, #E8D5A3 78%, #FFFFFF 82%, #E8D5A3 86%, #9B7B2F 95%, #1A1816 100%)",
          }}
        />
        <span className="absolute inset-[2px] rounded-full bg-dark group-hover:bg-dark/80 transition-colors" />
        <span className="absolute inset-0 flex items-center justify-center text-center text-cream font-inter text-xs font-medium leading-tight z-10">
          {lang === "zh" ? (
            <>
              立即
              <br />
              報名
            </>
          ) : (
            <>
              Register
            </>
          )}
        </span>
      </a>
    </div>
  );
}
