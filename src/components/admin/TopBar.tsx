"use client";

import { Search, Plus } from "lucide-react";
import { useState } from "react";

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export default function TopBar({
  title = "Dashboard",
  subtitle = "全球共善學思會 · May 7–9, 2026",
}: TopBarProps) {
  const [search, setSearch] = useState("");

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8 shrink-0">
      {/* Left: Title */}
      <div>
        <h1 className="text-lg font-semibold text-dark leading-tight">
          {title}
        </h1>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>

      {/* Right: Search + New Entry */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-light" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-cream/50 w-56 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 placeholder:text-muted-light"
          />
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-light transition-colors">
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>
    </header>
  );
}
