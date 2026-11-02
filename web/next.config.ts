import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosted font subsets. Filenames carry a content hash
  // (scripts/fonts/subset.py), so a URL never changes content: cache for a year.
  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  images: {
    remotePatterns: [
      // App icons / screenshots imported from the App Store CDN.
      { protocol: "https", hostname: "**.mzstatic.com" },
      { protocol: "https", hostname: "**.apple.com" },
      // Vercel Blob uploads.
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
