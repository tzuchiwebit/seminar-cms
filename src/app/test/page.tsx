import Link from "next/link";

export default function TestIndex() {
  const options = [
    { href: "/test/option-a", title: "Option A", desc: "Full-Viewport Image Cover — clean, minimal, scroll indicator" },
    { href: "/test/option-b", title: "Option B", desc: "Full-Viewport with Text Overlay — gradient + event info on banner" },
    { href: "/test/option-c", title: "Option C", desc: "Full-Viewport with Parallax — fixed background, content scrolls over" },
    { href: "/test/option-d", title: "Option D", desc: "Full-Viewport with Fade-in Reveal — animated text + scroll zoom effect" },
  ];

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <h1 className="font-serif text-dark text-4xl font-bold mb-2">Hero Banner Tests</h1>
        <p className="text-muted mb-10">Click each option to preview the full-viewport landing page.</p>
        <div className="space-y-4">
          {options.map((opt) => (
            <Link
              key={opt.href}
              href={opt.href}
              className="block p-6 bg-white rounded-xl border border-border hover:border-gold hover:shadow-lg transition-all group"
            >
              <h2 className="font-inter text-dark text-xl font-semibold group-hover:text-gold transition-colors">
                {opt.title}
              </h2>
              <p className="text-muted text-sm mt-1">{opt.desc}</p>
            </Link>
          ))}
        </div>
        <p className="text-muted text-xs mt-8">
          <Link href="/symposium" className="text-gold hover:underline">← Back to main site</Link>
        </p>
      </div>
    </div>
  );
}
