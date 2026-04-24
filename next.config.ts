import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Runtime mode (no static export). Public pages render at request time and
  // pull live data from Drust on every visit, so admin saves are immediately
  // visible without any "republish" step.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
