export default function Footer({ slug, lang = "en", siteName, copyright }: { slug: string; lang?: "zh" | "en"; siteName?: string; copyright?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-dark text-cream/80">
      <div className="mx-auto max-w-7xl px-6 py-4 text-center">
        <p className="font-inter text-xs text-cream/30">
          &copy; {year} {copyright || siteName || slug}
        </p>
      </div>
    </footer>
  );
}
