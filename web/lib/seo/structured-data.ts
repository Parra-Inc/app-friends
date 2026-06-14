const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://appfriends.dev";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "App Friends",
    url: SITE,
    logo: `${SITE}/icon.png`,
    sameAs: ["https://x.com/appfriends"],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "App Friends",
    url: SITE,
  };
}

export function softwareSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "App Friends SDK",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "iOS, Android",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}
