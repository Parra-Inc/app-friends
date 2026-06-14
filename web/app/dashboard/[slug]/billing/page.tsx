import { prisma } from "@/prisma/client";
import { getWorkspacePage } from "@/lib/auth/page";
import { stripeConfigured } from "@/lib/billing/stripe";
import { PRO_PRICE_USD_CENTS } from "@/lib/billing/plans";
import { SectionHeading, Card, Badge } from "@/components/ui/display";
import {
  UpgradeButton,
  ManageBillingButton,
  TopupControls,
} from "@/components/dashboard/billing-client";
import { formatUsd, timeAgo } from "@/lib/format";

export const metadata = { title: "Billing" };

export default async function BillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { workspace } = await getWorkspacePage(slug);

  const ledger = await prisma.ledgerEntry.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const isPro = workspace.plan === "PRO";
  const configured = stripeConfigured();

  return (
    <div className="p-8">
      <SectionHeading title="Billing" description="Your plan and campaign wallet." />

      {!configured ? (
        <Card className="mb-6 border-accent/40 p-4 text-sm text-ink-soft">
          Billing isn&apos;t configured on this deployment. Set{" "}
          <code className="font-mono">STRIPE_SECRET_KEY</code> and{" "}
          <code className="font-mono">STRIPE_PRICE_ID_PRO</code> to enable
          upgrades and top-ups.
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink">Plan</h3>
            <Badge tone={isPro ? "brand" : "muted"}>{isPro ? "Pro" : "Free"}</Badge>
          </div>
          {isPro ? (
            <>
              <p className="mt-2 text-sm text-muted">
                {formatUsd(PRO_PRICE_USD_CENTS)}/mo · unlimited apps, campaigns,
                advanced analytics.
                {workspace.subscriptionCurrentPeriodEnd
                  ? ` Renews ${workspace.subscriptionCurrentPeriodEnd.toLocaleDateString()}.`
                  : ""}
              </p>
              <div className="mt-4">
                <ManageBillingButton slug={slug} />
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">
                You&apos;re on Free — view-for-view pairings, one app, basic
                analytics. Upgrade for unlimited apps and sponsored campaigns.
              </p>
              <div className="mt-4">
                <UpgradeButton slug={slug} />
              </div>
            </>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-ink">Campaign wallet</h3>
          <div className="mt-2 text-3xl font-semibold text-ink tabular">
            {formatUsd(workspace.walletCents)}
          </div>
          <p className="mt-1 text-sm text-muted">
            Prepaid credit for sponsored campaigns. Tops up via Stripe.
          </p>
          <div className="mt-4">
            <TopupControls slug={slug} />
          </div>
        </Card>
      </div>

      <h3 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted">
        Recent activity
      </h3>
      {ledger.length === 0 ? (
        <Card className="p-6 text-sm text-muted">No transactions yet.</Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-muted">
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {ledger.map((e) => (
                <tr key={e.id}>
                  <td className="px-5 py-3 text-muted">{timeAgo(e.createdAt)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={e.amountCents >= 0 ? "positive" : "muted"}>
                      {e.type.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{e.description ?? "—"}</td>
                  <td
                    className={`px-5 py-3 text-right tabular ${e.amountCents >= 0 ? "text-positive" : "text-ink-soft"}`}
                  >
                    {e.amountCents >= 0 ? "+" : "−"}
                    {formatUsd(Math.abs(e.amountCents))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
