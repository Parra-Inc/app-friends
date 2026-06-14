import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms of using App Friends.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated June 2026</p>
      <div className="prose-af mt-8">
        <p>
          These terms govern your use of App Friends. By creating a workspace you
          agree to them. If you&apos;re using App Friends for a company, you&apos;re
          agreeing on its behalf.
        </p>

        <h2>The network</h2>
        <p>
          App Friends connects developers so they can promote each other&apos;s
          apps. You decide which apps to pair with and which advertisers to
          approve. You&apos;re responsible for the content and rights of any
          creative you upload, and for complying with the App Store and Google
          Play guidelines.
        </p>

        <h2>Fair play</h2>
        <ul>
          <li>Don&apos;t register apps you don&apos;t own or control.</li>
          <li>Don&apos;t generate fake impressions, taps, or installs.</li>
          <li>Don&apos;t promote content that&apos;s illegal, deceptive, or harmful.</li>
        </ul>
        <p>
          We may pause or remove apps and workspaces that abuse the network,
          including withholding settlement for fraudulent traffic.
        </p>

        <h2>Payments</h2>
        <p>
          Pro is billed monthly via Stripe and cancellable anytime. Sponsored
          spend is drawn from a prepaid wallet; unused balance is refundable on
          request. Publisher earnings accrue from approved sponsored placements
          and are paid out per our payout schedule.
        </p>

        <h2>Warranty &amp; liability</h2>
        <p>
          App Friends is provided &quot;as is.&quot; We work hard to keep the
          network running and fair, but we don&apos;t guarantee a specific number
          of installs. Our liability is limited to the amount you paid us in the
          prior three months.
        </p>

        <h2>Contact</h2>
        <p>
          Questions? <a href="mailto:hello@appfriends.dev">hello@appfriends.dev</a>.
        </p>
      </div>
    </div>
  );
}
