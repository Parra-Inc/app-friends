import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
