import { prisma } from "@/prisma/client";
import { getWorkspacePage } from "@/lib/auth/page";
import { SectionHeading } from "@/components/ui/display";
import {
  NetworkClient,
  type Friend,
  type IncomingReq,
  type OutgoingReq,
  type AdvReq,
  type MyApp,
} from "@/components/dashboard/network-client";
import { formatUsd } from "@/lib/format";

export const metadata = { title: "Network" };

export default async function NetworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { workspace } = await getWorkspacePage(slug);

  const apps = await prisma.app.findMany({
    where: { workspaceId: workspace.id },
    select: {
      id: true,
      name: true,
      iconUrl: true,
      category: true,
      platform: true,
      acceptsSponsored: true,
    },
  });
  const appIds = apps.map((a) => a.id);
  const appById = new Map(apps.map((a) => [a.id, a]));

  const myApps: MyApp[] = apps.map((a) => ({
    id: a.id,
    name: a.name,
    iconUrl: a.iconUrl,
    category: a.category,
  }));

  // All pairings involving my apps.
  const pairings = appIds.length
    ? await prisma.pairing.findMany({
        where: { OR: [{ appAId: { in: appIds } }, { appBId: { in: appIds } }] },
        include: {
          appA: { select: { id: true, name: true, iconUrl: true, category: true, workspaceId: true } },
          appB: { select: { id: true, name: true, iconUrl: true, category: true, workspaceId: true } },
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const friends: Friend[] = [];
  const incoming: IncomingReq[] = [];
  const outgoing: OutgoingReq[] = [];

  for (const p of pairings) {
    const mineIsA = appById.has(p.appAId);
    const mine = mineIsA ? p.appA : p.appB;
    const partner = mineIsA ? p.appB : p.appA;
    const hostBalance = mineIsA ? p.balance : -p.balance;

    if (p.status === "ACTIVE" || p.status === "PAUSED") {
      friends.push({
        pairingId: p.id,
        status: p.status,
        hostBalance,
        myAppName: mine.name,
        partnerName: partner.name,
        partnerIcon: partner.iconUrl,
        partnerCategory: partner.category,
      });
    } else if (p.status === "REQUESTED") {
      const iInitiated = appById.has(p.requestedByAppId);
      if (iInitiated) {
        outgoing.push({
          pairingId: p.id,
          toName: partner.name,
          toIcon: partner.iconUrl,
          status: p.status,
        });
      } else {
        incoming.push({
          pairingId: p.id,
          fromName: partner.name,
          fromIcon: partner.iconUrl,
          toName: mine.name,
          message: p.message,
        });
      }
    } else if (p.status === "DECLINED" && appById.has(p.requestedByAppId)) {
      outgoing.push({
        pairingId: p.id,
        toName: partner.name,
        toIcon: partner.iconUrl,
        status: p.status,
      });
    }
  }

  // Advertisers awaiting a decision: active campaigns from other workspaces that
  // target my sponsored-accepting apps and that I haven't approved/blocked yet.
  const sponsoredApps = apps.filter((a) => a.acceptsSponsored);
  const advertisers: AdvReq[] = [];
  if (sponsoredApps.length) {
    const campaigns = await prisma.campaign.findMany({
      where: { status: "ACTIVE", workspaceId: { not: workspace.id } },
      include: { app: { select: { name: true, iconUrl: true } } },
      take: 50,
    });
    const decisions = await prisma.adApproval.findMany({
      where: { publisherWorkspaceId: workspace.id },
      select: { publisherAppId: true, campaignId: true, status: true },
    });
    const decided = new Set(
      decisions
        .filter((d) => d.status !== "PENDING")
        .map((d) => `${d.publisherAppId}:${d.campaignId}`)
    );

    for (const app of sponsoredApps) {
      for (const c of campaigns) {
        if (c.targetPlatforms.length && !c.targetPlatforms.includes(app.platform)) continue;
        if (c.targetCategories.length && app.category && !c.targetCategories.includes(app.category)) continue;
        if (decided.has(`${app.id}:${c.id}`)) continue;
        advertisers.push({
          publisherAppId: app.id,
          campaignId: c.id,
          campaignName: c.name,
          advertiserAppName: c.app.name,
          advertiserIcon: c.app.iconUrl,
          publisherAppName: app.name,
          bidLabel:
            c.pricingModel === "CPI"
              ? `${formatUsd(c.bidCents)} per install`
              : `${formatUsd(c.bidCents)} CPM`,
        });
      }
    }
  }

  return (
    <div className="p-8">
      <SectionHeading
        title="Network"
        description="Your friends, pairing requests, and the advertisers who want into your apps."
      />
      <NetworkClient
        slug={slug}
        myApps={myApps}
        friends={friends}
        incoming={incoming}
        outgoing={outgoing}
        advertisers={advertisers}
      />
    </div>
  );
}
