import Link from "next/link";
import { Card } from "@/components/ui/display";

export const metadata = { title: "Overview" };

const cards = [
  { href: "/docs/quickstart", title: "Quickstart", body: "Register an app, grab a key, show your first promo." },
  { href: "/docs/ios", title: "iOS SDK", body: "SwiftUI popup + full-screen units in three lines." },
  { href: "/docs/react-native", title: "React Native SDK", body: "Drop-in components and a hook for Expo + bare RN." },
  { href: "/docs/api", title: "API reference", body: "The three SDK endpoints and their shapes." },
  { href: "/docs/dashboard", title: "Dashboard guide", body: "Apps, keys, pairings, campaigns, billing." },
];

export default function DocsHome() {
  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
        App Friends docs
      </h1>
      <p className="prose-af mt-3">
        App Friends is a cross-promotion network and SDK. You register your apps,
        get an API key, and drop the SDK into iOS or React Native. When your app
        asks the network for a promo, we return <em>other</em> apps to show —
        never your own — from your view-for-view pairings and any sponsored
        campaigns you&apos;ve approved.
      </p>
      <p className="prose-af">
        New here? Start with the <Link href="/docs/quickstart">Quickstart</Link>.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="h-full p-5 transition-colors hover:border-brand/40">
              <h3 className="font-semibold text-ink">{c.title}</h3>
              <p className="mt-1 text-sm text-muted">{c.body}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
