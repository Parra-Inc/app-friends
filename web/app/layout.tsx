import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/seo/structured-data";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appfriends.dev";

const description =
  "App Friends is the cross-promotion network and SDK for app developers. Trade installs with apps that aren't your competition — for free, or for hire.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "App Friends — Trade installs with apps that aren't your competition.",
    template: "%s · App Friends",
  },
  description,
  applicationName: "App Friends",
  category: "developer tools",
  keywords: [
    "app cross-promotion",
    "cross promotion network",
    "mobile app marketing",
    "user acquisition",
    "iOS SDK",
    "React Native SDK",
    "app install exchange",
    "view for view",
    "indie app developers",
    "app advertising",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "App Friends",
    title: "App Friends — Trade installs with apps that aren't your competition.",
    description,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "App Friends",
    description,
    site: "@appfriends",
    creator: "@appfriends",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0E0B1A" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-to-content">
          Skip to content
        </a>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <div id="main" className="contents">
          {children}
        </div>
      </body>
    </html>
  );
}
