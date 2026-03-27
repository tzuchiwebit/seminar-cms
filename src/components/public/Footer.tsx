import Link from "next/link";

export default function Footer({ slug }: { slug: string }) {
  const base = `/${slug}`;

  const footerLinks = [
    { href: `${base}#programme`, label: "議程" },
    { href: `${base}#speakers`, label: "講者" },
    { href: `${base}#exhibition`, label: "展覽" },
  ];

  return (
    <footer className="bg-dark text-cream/80">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full border-2 border-gold flex items-center justify-center">
                <span className="font-serif text-gold text-lg font-bold leading-none">
                  善
                </span>
              </div>
              <span className="font-inter text-sm font-medium text-cream">
                慈濟全球共善學思會 2026
              </span>
            </div>
            <p className="text-sm leading-relaxed text-cream/50">
              主辦：慈濟基金會
              <br />共同主辦：Harvard CAMLab
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-inter text-xs uppercase tracking-widest text-cream/40 mb-4">
              導覽
            </h4>
            <nav className="flex flex-col gap-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-inter text-sm text-cream/60 hover:text-cream transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-inter text-xs uppercase tracking-widest text-cream/40 mb-4">
              聯絡
            </h4>
            <div className="flex flex-col gap-3 text-sm text-cream/60">
              <a
                href="https://tzuchi.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cream transition-colors"
              >
                tzuchi.org
              </a>
              <a
                href="https://camlab.fas.harvard.edu"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cream transition-colors"
              >
                camlab.fas.harvard.edu
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream/10 text-center">
          <p className="font-inter text-xs text-cream/30">
            &copy; 2026 慈濟基金會 版權所有
          </p>
        </div>
      </div>
    </footer>
  );
}
