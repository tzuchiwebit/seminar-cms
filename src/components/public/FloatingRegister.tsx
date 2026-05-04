"use client";

export default function FloatingRegister({
  lang,
  onToggleLang,
  showLangToggle = true,
  googleFormUrl,
  registerVisible = true,
}: {
  lang: "zh" | "en";
  onToggleLang: () => void;
  showLangToggle?: boolean;
  googleFormUrl?: string;
  registerVisible?: boolean;
}) {
  const showRegisterBtn = !!googleFormUrl && registerVisible;
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
      {/* Language Toggle */}
      {showLangToggle && (
        <button
          onClick={onToggleLang}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dark/80 bg-white hover:bg-cream transition-colors flex items-center justify-center relative overflow-hidden shadow-md self-end"
          aria-label="Toggle language"
        >
          <div className="absolute w-[2px] h-[70%] bg-dark/40 rotate-[30deg]" />
          <span className={`absolute top-[8px] sm:top-[10px] left-[10px] sm:left-[12px] font-serif leading-none transition-all ${lang === "zh" ? "text-dark font-black text-[17px] sm:text-[19px]" : "text-muted font-semibold text-[13px] sm:text-[15px]"}`}>
            中
          </span>
          <span className={`absolute bottom-[8px] sm:bottom-[10px] right-[8px] sm:right-[10px] font-inter leading-none transition-all ${lang === "en" ? "text-dark font-bold text-[14px] sm:text-[16px]" : "text-muted font-semibold text-[10px] sm:text-[12px]"}`}>
            EN
          </span>
        </button>
      )}

      {/* Register Button — pill with diagonal arrow + subtle pulsing dot */}
      {showRegisterBtn && (
        <a
          href={googleFormUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-3 px-5 py-3 sm:px-7 sm:py-3.5 bg-dark text-cream rounded-full shadow-2xl hover:shadow-gold/40 hover:scale-105 transition-all duration-300 ring-1 ring-gold/30 hover:ring-gold/60 cursor-pointer"
        >
          {lang === "zh" ? (
            <span className="font-serif font-bold text-base sm:text-lg whitespace-nowrap tracking-wide">
              立即報名
            </span>
          ) : (
            <div className="flex flex-col items-center">
              <span className="font-serif font-bold text-sm sm:text-lg whitespace-nowrap leading-none">
                Click Here
              </span>
              <span className="text-xs sm:text-sm whitespace-nowrap opacity-90 leading-none mt-0.5">
                to Register
              </span>
            </div>
          )}

          <svg
            className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-gold transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="8,7 17,7 17,16" />
          </svg>

          <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-[18px] sm:w-[18px] pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-70" />
            <span className="relative inline-flex rounded-full h-4 w-4 sm:h-[18px] sm:w-[18px] bg-gold border border-cream/80" />
          </span>
        </a>
      )}
    </div>
  );
}
