export default function Footer({ slug, lang = "en", siteName, copyright }: { slug: string; lang?: "zh" | "en"; siteName?: string; copyright?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-dark text-cream/80">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col items-center gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-gold flex items-center justify-center">
              <span className="font-serif text-gold text-lg font-bold leading-none">
                善
              </span>
            </div>
            <span className="font-inter text-sm font-medium text-cream">
              {siteName || slug}
            </span>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-cream/10 text-center">
          <p className="font-inter text-xs text-cream/30">
            &copy; {year} {copyright || siteName || slug}
          </p>
        </div>
      </div>
    </footer>
  );
}
