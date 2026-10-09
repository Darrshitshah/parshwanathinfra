import type { NextConfig } from "next";

// cacheComponents is off on purpose: every page is static marketing content, and with it on Next keeps
// the previous route mounted but hidden (React Activity), which fights GSAP pinning and the page curtain.
// See docs/DECISIONS.md.
// NEXT_DIST_DIR lets parallel agents build or run dev servers without sharing .next (see docs/OWNERSHIP.md).
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 960, 1280, 1920, 2560],
    imageSizes: [64, 128, 256, 384],
    qualities: [60, 75, 85],
    minimumCacheTTL: 2678400,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
