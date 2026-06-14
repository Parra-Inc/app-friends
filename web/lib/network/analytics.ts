import { prisma } from "@/prisma/client";

export interface StatTotals {
  impressionsGiven: number; // as publisher
  impressionsReceived: number; // as promoted
  taps: number;
  installs: number;
  earnedCents: number;
  spendCents: number;
}

const ZERO: StatTotals = {
  impressionsGiven: 0,
  impressionsReceived: 0,
  taps: 0,
  installs: 0,
  earnedCents: 0,
  spendCents: 0,
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function workspaceTotals(
  workspaceId: string,
  days = 30
): Promise<StatTotals> {
  const rows = await prisma.dailyStat.findMany({
    where: { app: { workspaceId }, day: { gte: daysAgo(days) } },
  });
  return rows.reduce<StatTotals>((acc, r) => {
    if (r.role === "PUBLISHER") {
      acc.impressionsGiven += r.impressions;
      acc.earnedCents += r.earnedCents;
    } else {
      acc.impressionsReceived += r.impressions;
      acc.spendCents += r.spendCents;
    }
    acc.taps += r.taps;
    acc.installs += r.installs;
    return acc;
  }, { ...ZERO });
}

export interface DailyPoint {
  day: string; // YYYY-MM-DD
  impressionsGiven: number;
  impressionsReceived: number;
  taps: number;
  installs: number;
}

export async function workspaceSeries(
  workspaceId: string,
  days = 30
): Promise<DailyPoint[]> {
  const rows = await prisma.dailyStat.findMany({
    where: { app: { workspaceId }, day: { gte: daysAgo(days) } },
    orderBy: { day: "asc" },
  });

  const byDay = new Map<string, DailyPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const key = daysAgo(i).toISOString().slice(0, 10);
    byDay.set(key, {
      day: key,
      impressionsGiven: 0,
      impressionsReceived: 0,
      taps: 0,
      installs: 0,
    });
  }
  for (const r of rows) {
    const key = r.day.toISOString().slice(0, 10);
    const point = byDay.get(key);
    if (!point) continue;
    if (r.role === "PUBLISHER") point.impressionsGiven += r.impressions;
    else point.impressionsReceived += r.impressions;
    point.taps += r.taps;
    point.installs += r.installs;
  }
  return [...byDay.values()];
}

export async function appTotals(appId: string, days = 30): Promise<StatTotals> {
  const rows = await prisma.dailyStat.findMany({
    where: { appId, day: { gte: daysAgo(days) } },
  });
  return rows.reduce<StatTotals>((acc, r) => {
    if (r.role === "PUBLISHER") {
      acc.impressionsGiven += r.impressions;
      acc.earnedCents += r.earnedCents;
    } else {
      acc.impressionsReceived += r.impressions;
      acc.spendCents += r.spendCents;
    }
    acc.taps += r.taps;
    acc.installs += r.installs;
    return acc;
  }, { ...ZERO });
}

export async function campaignTotals(campaignId: string): Promise<{
  impressions: number;
  taps: number;
  installs: number;
  spentCents: number;
}> {
  const grouped = await prisma.promoEvent.groupBy({
    by: ["type"],
    where: { campaignId },
    _count: { _all: true },
    _sum: { valueCents: true },
  });
  let impressions = 0;
  let taps = 0;
  let installs = 0;
  let spentCents = 0;
  for (const g of grouped) {
    if (g.type === "IMPRESSION") impressions = g._count._all;
    if (g.type === "TAP") taps = g._count._all;
    if (g.type === "INSTALL") installs = g._count._all;
    spentCents += g._sum.valueCents ?? 0;
  }
  return { impressions, taps, installs, spentCents };
}
