import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/display";
import { PLAN_FEATURES, PRO_PRICE_USD_CENTS } from "@/lib/billing/plans";
import { formatUsd } from "@/lib/format";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "App Friends is free to join and free to pair. Pro is $19/mo for unlimited apps and sponsored campaigns. Sponsored spend is pay-as-you-go.",
};

function Check({ on }: { on: boolean }) {
  return on ? (
    <span className="text-positive">✓</span>
  ) : (
    <span className="text-muted">—</span>
  );
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-20">
      <div className="text-center">
        <Badge tone="brand">Pricing</Badge>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">
          Free to join. Free to pair.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">
          View-for-view costs nothing — it&apos;s a trade. Upgrade to Pro when you
          want more apps and the option to run sponsored campaigns.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Card className="p-8">
          <h2 className="text-lg font-semibold text-ink">Free</h2>
          <p className="mt-1 text-sm text-muted">Get on the network.</p>
          <div className="mt-5 text-4xl font-semibold text-ink">$0</div>
          <p className="mt-1 text-sm text-muted">forever</p>
          <Button href="/auth/signin" variant="secondary" className="mt-6 w-full">
            Start free
          </Button>
        </Card>
        <Card className="relative overflow-hidden border-brand/40 p-8">
          <span className="absolute right-4 top-4">
            <Badge tone="brand">Most popular</Badge>
          </span>
          <h2 className="text-lg font-semibold text-ink">Pro</h2>
          <p className="mt-1 text-sm text-muted">For studios and growing apps.</p>
          <div className="mt-5 text-4xl font-semibold text-ink">
            {formatUsd(PRO_PRICE_USD_CENTS)}
            <span className="text-base font-normal text-muted"> /mo</span>
          </div>
          <p className="mt-1 text-sm text-muted">per workspace</p>
          <Button href="/auth/signin" className="mt-6 w-full">
            Start free, upgrade anytime
          </Button>
        </Card>
      </div>

      <Card className="mt-8 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rule text-left text-muted">
              <th className="px-5 py-3 font-medium">Feature</th>
              <th className="px-5 py-3 text-center font-medium">Free</th>
              <th className="px-5 py-3 text-center font-medium">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {PLAN_FEATURES.map((f) => (
              <tr key={f.label}>
                <td className="px-5 py-3 text-ink">{f.label}</td>
                <td className="px-5 py-3 text-center">
                  {typeof f.free === "boolean" ? <Check on={f.free} /> : <span className="text-ink-soft">{f.free}</span>}
                </td>
                <td className="px-5 py-3 text-center">
                  {typeof f.pro === "boolean" ? <Check on={f.pro} /> : <span className="text-ink-soft">{f.pro}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-10 rounded-2xl border border-rule bg-paper-raised p-8">
        <h3 className="text-lg font-semibold text-ink">Sponsored spend is separate</h3>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Campaigns run from a prepaid wallet — top up any amount, set a bid
          (cost per install or per thousand impressions), and pause whenever you
          like. Publishers earn a share of every sponsored placement they show.
          No monthly minimum, no exchange fees buried in a CPM.
        </p>
      </div>
    </div>
  );
}
