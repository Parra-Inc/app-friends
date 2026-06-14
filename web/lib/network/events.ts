import { prisma } from "@/prisma/client";
import { Prisma } from "@prisma/client";
import type { PromoTokenClaims } from "@/lib/sdk/token";
import type { EventType } from "@/lib/sdk/contract";
import { logger } from "@/lib/logger";

const log = logger("events");

/** Publisher's share of sponsored revenue. The network keeps the rest. */
const PUBLISHER_REVENUE_SHARE = 0.7;

type RecordResult = { recorded: boolean; duplicate?: boolean };

/**
 * Record one promo event. Idempotent per (token, type) via the DB unique
 * constraint, so retried/duplicated client events are no-ops. Updates pairing
 * balance, daily rollups, and (for sponsored) campaign spend + wallet ledger.
 */
export async function recordEvent(
  claims: PromoTokenClaims,
  type: EventType,
  country?: string | null
): Promise<RecordResult> {
  const source = claims.src === "C" ? "CAMPAIGN" : "PAIRING";
  const eventType =
    type === "impression" ? "IMPRESSION" : type === "tap" ? "TAP" : "INSTALL";

  // Compute the monetary value of this event for sponsored placements.
  let valueCents = 0;
  let campaign = null as Awaited<
    ReturnType<typeof prisma.campaign.findUnique>
  > | null;
  if (source === "CAMPAIGN" && claims.cmp) {
    campaign = await prisma.campaign.findUnique({ where: { id: claims.cmp } });
    if (campaign) {
      if (campaign.pricingModel === "CPM" && eventType === "IMPRESSION") {
        valueCents = Math.round(campaign.bidCents / 1000);
      } else if (campaign.pricingModel === "CPI" && eventType === "INSTALL") {
        valueCents = campaign.bidCents;
      }
    }
  }

  try {
    await prisma.promoEvent.create({
      data: {
        token: claims.n
          ? `${claims.pub}:${claims.pro}:${claims.n}`
          : `${claims.pub}:${claims.pro}`,
        type: eventType,
        source,
        publisherAppId: claims.pub,
        promotedAppId: claims.pro,
        campaignId: claims.cmp ?? null,
        placement: claims.plc,
        country: country ?? null,
        valueCents,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { recorded: false, duplicate: true };
    }
    throw err;
  }

  // Side effects run best-effort; the event is already durably recorded.
  await applySideEffects({
    eventType,
    source,
    claims,
    valueCents,
    campaign,
  }).catch((e) => log.error("side-effects failed", e));

  return { recorded: true };
}

async function applySideEffects(args: {
  eventType: "IMPRESSION" | "TAP" | "INSTALL";
  source: "PAIRING" | "CAMPAIGN";
  claims: PromoTokenClaims;
  valueCents: number;
  campaign: Awaited<ReturnType<typeof prisma.campaign.findUnique>> | null;
}) {
  const { eventType, source, claims, valueCents, campaign } = args;
  const day = startOfUtcDay();

  const ops: Prisma.PrismaPromise<unknown>[] = [];

  // Publisher-side daily rollup (this app showed someone).
  ops.push(
    statBump({
      day,
      appId: claims.pub,
      role: "PUBLISHER",
      source,
      eventType,
      earnedCents:
        source === "CAMPAIGN" && valueCents
          ? Math.round(valueCents * PUBLISHER_REVENUE_SHARE)
          : 0,
    })
  );

  // Promoted-side daily rollup (this app was shown).
  ops.push(
    statBump({
      day,
      appId: claims.pro,
      role: "PROMOTED",
      source,
      eventType,
      spendCents: source === "CAMPAIGN" ? valueCents : 0,
    })
  );

  // View-for-view balancing on impression.
  if (source === "PAIRING" && eventType === "IMPRESSION") {
    ops.push(...(await pairingBalanceOps(claims.pub, claims.pro)));
  }

  // Sponsored spend settlement.
  if (source === "CAMPAIGN" && valueCents > 0 && campaign) {
    ops.push(
      prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          spentCents: { increment: valueCents },
          status:
            campaign.spentCents + valueCents >= campaign.totalBudgetCents
              ? "DEPLETED"
              : campaign.status,
        },
      })
    );
    ops.push(
      prisma.workspace.update({
        where: { id: campaign.workspaceId },
        data: { walletCents: { decrement: valueCents } },
      })
    );
    ops.push(
      prisma.ledgerEntry.create({
        data: {
          workspaceId: campaign.workspaceId,
          type: "SPEND",
          amountCents: -valueCents,
          balanceCents: 0, // reconciled by the nightly settle job
          campaignId: campaign.id,
          description: `${eventType.toLowerCase()} · ${campaign.name}`,
        },
      })
    );
  }

  await prisma.$transaction(ops);
}

function statBump(args: {
  day: Date;
  appId: string;
  role: "PUBLISHER" | "PROMOTED";
  source: "PAIRING" | "CAMPAIGN";
  eventType: "IMPRESSION" | "TAP" | "INSTALL";
  earnedCents?: number;
  spendCents?: number;
}) {
  const inc = {
    impressions: args.eventType === "IMPRESSION" ? 1 : 0,
    taps: args.eventType === "TAP" ? 1 : 0,
    installs: args.eventType === "INSTALL" ? 1 : 0,
    earnedCents: args.earnedCents ?? 0,
    spendCents: args.spendCents ?? 0,
  };
  return prisma.dailyStat.upsert({
    where: {
      day_appId_role_source: {
        day: args.day,
        appId: args.appId,
        role: args.role,
        source: args.source,
      },
    },
    update: {
      impressions: { increment: inc.impressions },
      taps: { increment: inc.taps },
      installs: { increment: inc.installs },
      earnedCents: { increment: inc.earnedCents },
      spendCents: { increment: inc.spendCents },
    },
    create: {
      day: args.day,
      appId: args.appId,
      role: args.role,
      source: args.source,
      ...inc,
    },
  });
}

async function pairingBalanceOps(
  publisherAppId: string,
  promotedAppId: string
): Promise<Prisma.PrismaPromise<unknown>[]> {
  const [appAId, appBId] =
    publisherAppId < promotedAppId
      ? [publisherAppId, promotedAppId]
      : [promotedAppId, publisherAppId];
  const pairing = await prisma.pairing.findUnique({
    where: { appAId_appBId: { appAId, appBId } },
    include: { appA: { select: { workspaceId: true } }, appB: { select: { workspaceId: true } } },
  });
  if (!pairing) return [];

  // balance = (A→B) − (B→A). Publisher showed promoted, so:
  const delta = publisherAppId === appAId ? 1 : -1;
  const pubWorkspaceId =
    publisherAppId === appAId ? pairing.appA.workspaceId : pairing.appB.workspaceId;
  const proWorkspaceId =
    promotedAppId === appAId ? pairing.appA.workspaceId : pairing.appB.workspaceId;

  return [
    prisma.pairing.update({
      where: { id: pairing.id },
      data: { balance: { increment: delta } },
    }),
    // Reputation: publisher gave a view (+1), promoted received one (−1).
    prisma.workspace.update({
      where: { id: pubWorkspaceId },
      data: { balance: { increment: 1 } },
    }),
    prisma.workspace.update({
      where: { id: proWorkspaceId },
      data: { balance: { increment: -1 } },
    }),
  ];
}

function startOfUtcDay(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}
