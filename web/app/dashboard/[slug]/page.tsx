import Link from "next/link";
import { prisma } from "@/prisma/client";
import { getWorkspacePage } from "@/lib/auth/page";
import { workspaceTotals } from "@/lib/network/analytics";
import { Stat, Card, Badge, SectionHeading } from "@/components/ui/display";
import { Button } from "@/components/ui/Button";
import { formatCount, formatUsd, formatPct } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: `Overview · ${slug}` };
}

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { workspace } = await getWorkspacePage(slug);

  const myApps = await prisma.app.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true },
  });
  const appIds = myApps.map((a) => a.id);
  const appCount = appIds.length;

  const [activePairings, pendingRequests, activeCampaigns, pendingApprovals, totals] =
    await Promise.all([
      prisma.pairing.count({
        where: {
          status: "ACTIVE",
          OR: [{ appAId: { in: appIds } }, { appBId: { in: appIds } }],
        },
      }),
      prisma.pairing.count({
        where: {
          status: "REQUESTED",
          OR: [{ appAId: { in: appIds } }, { appBId: { in: appIds } }],
          requestedByAppId: { notIn: appIds.length ? appIds : ["_"] },
        },
      }),
      prisma.campaign.count({
        where: { workspaceId: workspace.id, status: "ACTIVE" },
      }),
      prisma.adApproval.count({
        where: { publisherWorkspaceId: workspace.id, status: "PENDING" },
      }),
      workspaceTotals(workspace.id, 30),
    ]);

  if (appCount === 0) {
    return (
      <div className="p-8">
        <SectionHeading
          title={`Welcome to ${workspace.name}`}
          description="Let's get your first app on the network."
        />
        <GettingStarted slug={slug} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <SectionHeading
        title="Overview"
        description={`Last 30 days across ${workspace.name}.`}
        action={
          <Badge tone={workspace.plan === "PRO" ? "brand" : "muted"}>
            {workspace.plan === "PRO" ? "Pro" : "Free"} plan
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Installs driven"
          value={formatCount(totals.installs)}
          sub={`${formatPct(totals.installs, totals.taps)} of taps`}
          tone="positive"
        />
        <Stat
          label="Views received"
          value={formatCount(totals.impressionsReceived)}
          sub={`${formatCount(totals.taps)} taps`}
        />
        <Stat
          label="Views given"
          value={formatCount(totals.impressionsGiven)}
          sub="to your friends"
          tone="brand"
        />
        <Stat
          label="Wallet"
          value={formatUsd(workspace.walletCents)}
          sub={`${formatUsd(totals.earnedCents)} earned`}
          tone="accent"
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <LinkCard
          href={`/dashboard/${slug}/network`}
          title="Network"
          value={`${activePairings} friends`}
          hint={
            pendingRequests > 0
              ? `${pendingRequests} request${pendingRequests === 1 ? "" : "s"} waiting`
              : "Find more friends"
          }
          alert={pendingRequests > 0}
        />
        <LinkCard
          href={`/dashboard/${slug}/campaigns`}
          title="Campaigns"
          value={`${activeCampaigns} active`}
          hint={
            pendingApprovals > 0
              ? `${pendingApprovals} advertiser${pendingApprovals === 1 ? "" : "s"} to review`
              : "Reach beyond your pairings"
          }
          alert={pendingApprovals > 0}
        />
        <LinkCard
          href={`/dashboard/${slug}/apps`}
          title="Apps"
          value={`${appCount} registered`}
          hint="Manage creative & settings"
        />
      </div>
    </div>
  );
}

function LinkCard({
  href,
  title,
  value,
  hint,
  alert,
}: {
  href: string;
  title: string;
  value: string;
  hint: string;
  alert?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="p-5 transition-colors hover:border-brand/40">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">{title}</span>
          {alert ? <Badge tone="accent">Action needed</Badge> : null}
        </div>
        <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
        <div className="mt-1 text-sm text-muted">{hint}</div>
      </Card>
    </Link>
  );
}

function GettingStarted({ slug }: { slug: string }) {
  const steps = [
    {
      title: "Register your first app",
      body: "Paste a bundle id and we'll pull its icon, screenshots, and category.",
      cta: "Add an app",
      href: `/dashboard/${slug}/apps`,
    },
    {
      title: "Create an API key",
      body: "You'll drop the publishable key into your iOS or React Native app.",
      cta: "Create a key",
      href: `/dashboard/${slug}/keys`,
    },
    {
      title: "Find your first friend",
      body: "Browse non-competing apps and send a pairing request.",
      cta: "Open the network",
      href: `/dashboard/${slug}/network`,
    },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {steps.map((s, i) => (
        <Card key={s.title} className="flex flex-col p-6">
          <div className="font-mono text-sm font-semibold text-brand">
            Step {i + 1}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-ink">{s.title}</h3>
          <p className="mt-1 flex-1 text-sm text-muted">{s.body}</p>
          <Button href={s.href} variant="secondary" size="sm" className="mt-4 self-start">
            {s.cta}
          </Button>
        </Card>
      ))}
    </div>
  );
}
