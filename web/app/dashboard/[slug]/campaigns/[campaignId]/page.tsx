import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/prisma/client";
import { getWorkspacePage } from "@/lib/auth/page";
import { campaignTotals } from "@/lib/network/analytics";
import { SectionHeading, Stat, Card, Badge } from "@/components/ui/display";
import { CampaignStatusButton } from "@/components/dashboard/campaigns-client";
import { AppIcon } from "@/components/dashboard/AppIcon";
import { formatUsd, formatCount, formatPct } from "@/lib/format";

export const metadata = { title: "Campaign" };

export default async function CampaignDetail({
  params,
}: {
  params: Promise<{ slug: string; campaignId: string }>;
}) {
  const { slug, campaignId } = await params;
  const { workspace } = await getWorkspacePage(slug);

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId: workspace.id },
    include: { app: { select: { name: true, iconUrl: true } } },
  });
  if (!campaign) notFound();

  const totals = await campaignTotals(campaign.id);
  const budgetPct =
    campaign.totalBudgetCents > 0
      ? Math.min(100, (campaign.spentCents / campaign.totalBudgetCents) * 100)
      : 0;

  return (
    <div className="p-8">
      <Link href={`/dashboard/${slug}/campaigns`} className="text-sm text-muted hover:text-ink">
        ← Campaigns
      </Link>

      <div className="mt-4">
        <SectionHeading
          title={campaign.name}
          description={`Promoting ${campaign.app.name}`}
          action={
            <CampaignStatusButton slug={slug} campaignId={campaign.id} status={campaign.status} />
          }
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone="brand">
          {campaign.pricingModel === "CPI"
            ? `${formatUsd(campaign.bidCents)} per install`
            : `${formatUsd(campaign.bidCents)} CPM`}
        </Badge>
        {campaign.targetPlatforms.length ? (
          <Badge tone="muted">{campaign.targetPlatforms.join(", ")}</Badge>
        ) : (
          <Badge tone="muted">all platforms</Badge>
        )}
        {campaign.targetCategories.length ? (
          <Badge tone="muted">{campaign.targetCategories.length} categories</Badge>
        ) : (
          <Badge tone="muted">all categories</Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Views" value={formatCount(totals.impressions)} />
        <Stat label="Taps" value={formatCount(totals.taps)} sub={formatPct(totals.taps, totals.impressions)} />
        <Stat label="Installs" value={formatCount(totals.installs)} tone="positive" />
        <Stat label="Spent" value={formatUsd(totals.spentCents)} tone="accent" />
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Budget used</span>
          <span className="text-ink tabular">
            {formatUsd(campaign.spentCents)} / {formatUsd(campaign.totalBudgetCents)}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-rule">
          <div className="h-full rounded-full bg-brand" style={{ width: `${budgetPct}%` }} />
        </div>
      </Card>

      <Card className="mt-6 flex items-center gap-4 p-5">
        <AppIcon src={campaign.app.iconUrl} name={campaign.app.name} />
        <div>
          <div className="text-sm text-muted">Advertised app</div>
          <div className="font-medium text-ink">{campaign.app.name}</div>
        </div>
      </Card>
    </div>
  );
}
