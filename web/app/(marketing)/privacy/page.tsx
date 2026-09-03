import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How App Friends handles your data and your users' data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
        Privacy
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated June 2026</p>
      <div className="prose-af mt-8">
        <p>
          App Friends helps app developers cross-promote with each other. This
          page explains what we collect, why, and what we don&apos;t do.
        </p>

        <h2>What the SDK sends us</h2>
        <p>
          When your app asks the network for promos, the SDK sends your app&apos;s
          bundle id and your publishable API key. When a promo is shown, tapped,
          or leads to an install, the SDK sends an opaque event token and an
          optional two-letter country code.
        </p>
        <p>
          The SDK does <strong>not</strong> collect device identifiers (IDFA/GAID),
          contacts, location beyond country, or any personal data about your
          users. We don&apos;t fingerprint devices and we don&apos;t build
          cross-app profiles of end users.
        </p>

        <h2>What you give us</h2>
        <ul>
          <li>Account details: your name and email, via your sign-in provider.</li>
          <li>App metadata: bundle ids, names, icons, screenshots, categories.</li>
          <li>
            App Store Connect API keys, if you connect them. These are encrypted
            at rest and used only to import your app catalog.
          </li>
          <li>Billing details, handled by Stripe — we never see card numbers.</li>
        </ul>

        <h2>How we use it</h2>
        <p>
          To run the network: decide which apps to show, keep view-for-view
          exchanges balanced, settle sponsored spend, and show you analytics. We
          don&apos;t sell your data.
        </p>

        <h2>Sub-processors</h2>
        <ul>
          <li>Stripe — payments.</li>
          <li>Neon / Vercel — hosting and database.</li>
          <li>Cloudflare — transactional email.</li>
          <li>Upstash — rate limiting.</li>
        </ul>

        <h2>Your choices</h2>
        <p>
          You can delete an app or your whole workspace at any time, which removes
          its data from the network. Email{" "}
          <a href="mailto:privacy@appfriends.dev">privacy@appfriends.dev</a> for
          data requests.
        </p>
      </div>
    </div>
  );
}
