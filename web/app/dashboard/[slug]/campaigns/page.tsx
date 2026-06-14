import Link from "next/link";
import { prisma } from "@/prisma/client";
import { getWorkspacePage } from "@/lib/auth/page";
import { planLimits } from "@/lib/billing/plans";
import { SectionHeading, Card, Badge, EmptyState } from "@/components/ui/display";
import { Button } from "@/components/ui/Button";
import { CreateCampaign } from "@/components/dashboard/campaigns-client";
import { formatUsd } from "@/lib/format";
import type { CampaignStatus } from "@prisma/client";

export const metadata = { title: "Campaigns" };

const statusTone: Record<CampaignStatus, "positive" | "muted" | "accent" | "brand" | "error"> = {
  ACTIVE: "positive",
  DRAFT: "muted",
  PAUSED: "accent",
  DEPLETED: "error",
  ENDED: "muted",
};

export default async function CampaignsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { workspace } = await getWorkspacePage(slug);

  if (!planLimits(workspace.plan).canRunCampaigns) {
    return (
      <div className="p-8">
        <SectionHeading
          title="Campaigns"
          description="Reach beyond your pairings with sponsored placements."
        />
        <Card className="p-8 text-center">
          <h3 className="font-display text-xl text-ink">Campaigns are a Pro feature</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            View-for-view is free forever. Upgrade to Pro to run sponsored
            campaigns and reach apps beyond your pairings — you only pay for the
            installs or views you get.
          </p>
          <Button href={`/dashboard/${slug}/billing`} className="mt-6">
            Upgrade to Pro
          </Button>
        </Card>
      </div>
    );
  }

  const apps = await prisma.app.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true, name: true },
  });
  const campaigns = await prisma.campaign.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    include: { app: { select: { name: true, iconUrl: true } } },
  });

  return (
    <div className="p-8">
      <SectionHeading
        title="Campaigns"
        description="Sponsored placements you're running."
        action={
          <Badge tone="accent">Wallet {formatUsd(workspace.walletCents)}</Badge>
        }
      />

      {apps.length === 0 ? (
        <EmptyState
          title="Add an app to advertise first"
          description="You need a registered app before you can run a campaign for it."
          action={<Button href={`/dashboard/${slug}/apps`}>Add an app</Button>}
        />
      ) : (
        <>
          <div className="mb-6">
            <CreateCampaign slug={slug} apps={apps} />
          </div>

          {campaigns.length === 0 ? (
            <EmptyState
              title="No campaigns yet"
              description="Create a campaign to start reaching apps beyond your pairings."
            />
          ) : (
            <div className="grid gap-3">
              {campaigns.map((c) => {
                const spentPct =
                  c.totalBudgetCents > 0
                    ? Math.min(100, (c.spentCents / c.totalBudgetCents) * 100)
                    : 0;
                return (
                  <Link key={c.id} href={`/dashboard/${slug}/campaigns/${c.id}`}>
                    <Card className="p-4 transition-colors hover:border-brand/40">
                      <div className="flex items-center gap-3">
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-medium text-ink">{c.name}</span>
                            <Badge tone={statusTone[c.status]}>{c.status.toLowerCase()}</Badge>
                          </span>
                          <span className="block text-xs text-muted">
                            promoting {c.app.name} ·{" "}
                            {c.pricingModel === "CPI"
                              ? `${formatUsd(c.bidCents)}/install`
                              : `${formatUsd(c.bidCents)} CPM`}
                          </span>
                        </span>
                        <span className="hidden text-right sm:block">
                          <span className="block text-sm text-ink tabular">
                            {formatUsd(c.spentCents)} / {formatUsd(c.totalBudgetCents)}
                          </span>
                          <span className="block text-xs text-muted">spent</span>
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-rule">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${spentPct}%` }} />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
