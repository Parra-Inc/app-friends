import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://app-friends-web-production.ian-b42.workers.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard", "/api/", "/auth/"] },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
