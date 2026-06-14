import { prisma } from "@/prisma/client";
import { mintPromoToken } from "@/lib/sdk/token";
import { SDK_DEFAULTS } from "@/lib/sdk/contract";
import type { Placement, Promo, PromotionsResponse } from "@/lib/sdk/contract";
import type { App, Campaign } from "@prisma/client";

interface BuildArgs {
  hostApp: App;
  placement: Placement;
  limit: number;
  country?: string | null;
}

/**
 * Build the list of promos to show inside `hostApp`. Combines two supply
 * sources — paid campaigns (approved by the publisher) and view-for-view
 * pairings (balanced by who owes whom) — and never returns the host's own app
 * or another app from the host's workspace.
 */
export async function buildPromotions(
  args: BuildArgs
): Promise<PromotionsResponse> {
  const { hostApp, placement } = args;
  const limit = Math.min(Math.max(args.limit, 1), SDK_DEFAULTS.maxPromos);

  const [sponsored, paired] = await Promise.all([
    hostApp.acceptsSponsored ? sponsoredCandidates(hostApp) : Promise.resolve([]),
    hostApp.acceptsPairings ? pairedCandidates(hostApp) : Promise.resolve([]),
  ]);

  // Interleave sponsored (pays) with pairings (free, balanced), de-duping by app.
  const ordered = interleave(sponsored, paired);
  const seen = new Set<string>([hostApp.id]);
  const chosen: Candidate[] = [];
  for (const c of ordered) {
    if (seen.has(c.app.id)) continue;
    if (c.app.workspaceId === hostApp.workspaceId) continue;
    seen.add(c.app.id);
    chosen.push(c);
    if (chosen.length >= limit) break;
  }

  const promos: Promo[] = await Promise.all(
    chosen.map((c) => toPromo(c, hostApp, placement))
  );

  const servedAt = new Date();
  const expiresAt = new Date(
    servedAt.getTime() + SDK_DEFAULTS.cacheSeconds * 1000
  );

  return {
    promos,
    servedAt: servedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    placement,
  };
}

type Candidate = {
  app: App;
  source: "PAIRING" | "CAMPAIGN";
  campaign?: Campaign;
  /** Ranking score within its source (higher = better). */
  score: number;
};

async function sponsoredCandidates(hostApp: App): Promise<Candidate[]> {
  // Active campaigns with remaining budget, matching targeting, from other
  // workspaces, whose app is active and isn't the host.
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "ACTIVE",
      workspaceId: { not: hostApp.workspaceId },
      app: { status: "ACTIVE", id: { not: hostApp.id } },
      OR: [
        { targetPlatforms: { isEmpty: true } },
        { targetPlatforms: { has: hostApp.platform } },
      ],
    },
    include: { app: true },
    take: 100,
  });

  // Publisher approval gate: explicit APPROVED, or workspace auto-approve, minus
  // any explicit BLOCK.
  const approvals = await prisma.adApproval.findMany({
    where: { publisherAppId: hostApp.id, campaignId: { in: campaigns.map((c) => c.id) } },
  });
  const approvalByCampaign = new Map(approvals.map((a) => [a.campaignId, a.status]));

  const host = await prisma.workspace.findUnique({
    where: { id: hostApp.workspaceId },
    select: { autoApproveAdvertisers: true },
  });
  const autoApprove = host?.autoApproveAdvertisers ?? false;

  const out: Candidate[] = [];
  for (const c of campaigns) {
    if (c.spentCents >= c.totalBudgetCents) continue; // depleted
    if (c.targetCategories.length && hostApp.category &&
        !c.targetCategories.includes(hostApp.category)) {
      // host's category not targeted — but allow if targeting is by-app elsewhere
      continue;
    }
    const decision = approvalByCampaign.get(c.id);
    if (decision === "BLOCKED") continue;
    if (decision !== "APPROVED" && !autoApprove) continue;

    // Effective value: CPI bid directly; CPM normalized per-impression.
    const score =
      c.pricingModel === "CPM" ? c.bidCents / 1000 + 0.0001 : c.bidCents;
    out.push({ app: c.app, source: "CAMPAIGN", campaign: c, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

async function pairedCandidates(hostApp: App): Promise<Candidate[]> {
  const pairings = await prisma.pairing.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ appAId: hostApp.id }, { appBId: hostApp.id }],
    },
    include: { appA: true, appB: true },
    take: 200,
  });

  const out: Candidate[] = [];
  for (const p of pairings) {
    const partner = p.appAId === hostApp.id ? p.appB : p.appA;
    if (partner.status !== "ACTIVE" || !partner.acceptsPairings) continue;
    // host-relative balance: (host→partner) − (partner→host). The more negative,
    // the more the host "owes" the partner → show it sooner. Score is the
    // negation so higher = should-show-more.
    const hostBalance = p.appAId === hostApp.id ? p.balance : -p.balance;
    out.push({ app: partner, source: "PAIRING", score: -hostBalance });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

/** Alternate sponsored, pairing, sponsored, pairing … so both get airtime. */
function interleave(a: Candidate[], b: Candidate[]): Candidate[] {
  const out: Candidate[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

async function toPromo(
  c: Candidate,
  hostApp: App,
  placement: Placement
): Promise<Promo> {
  const token = await mintPromoToken({
    pub: hostApp.id,
    pro: c.app.id,
    src: c.source === "CAMPAIGN" ? "C" : "P",
    cmp: c.campaign?.id,
    plc: placement,
    n: cryptoNonce(),
  });

  return {
    id: c.app.id,
    token,
    source: c.source,
    placement,
    appName: c.app.name,
    subtitle: c.app.subtitle,
    headline: c.app.promoHeadline,
    iconUrl: c.app.iconUrl,
    screenshots: c.app.promoScreenshots,
    storeUrl: c.app.storeUrl,
    category: c.app.category,
    ratingAvg: c.app.ratingAvg,
    ratingCount: c.app.ratingCount,
    cta: "Get",
    sponsored: c.source === "CAMPAIGN",
  };
}

function cryptoNonce(): string {
  // Cheap, unique-enough nonce for token uniqueness (token itself is signed).
  return (
    Math.random().toString(36).slice(2) + Date.now().toString(36)
  );
}
