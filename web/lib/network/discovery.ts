import { prisma } from "@/prisma/client";
import { canonicalPair } from "./pairings";

export interface DiscoverableApp {
  id: string;
  name: string;
  subtitle: string | null;
  iconUrl: string | null;
  category: string | null;
  platform: string;
  ratingAvg: number | null;
  ratingCount: number | null;
  workspaceName: string;
  /** Existing pairing status with the viewer's app, if any. */
  pairingStatus: string | null;
  pairingId: string | null;
}

/**
 * Find candidate friends for `forAppId`: active apps from other workspaces,
 * excluding same-category competitors by default (the overlap guard) and apps
 * already paired or with a pending request.
 */
export async function discoverApps(args: {
  forAppId: string;
  query?: string;
  includeOverlap?: boolean;
  category?: string;
  limit?: number;
}): Promise<DiscoverableApp[]> {
  const self = await prisma.app.findUnique({ where: { id: args.forAppId } });
  if (!self) return [];

  const apps = await prisma.app.findMany({
    where: {
      status: "ACTIVE",
      acceptsPairings: true,
      workspaceId: { not: self.workspaceId },
      id: { not: self.id },
      ...(args.category ? { category: args.category } : {}),
      ...(args.query
        ? { name: { contains: args.query, mode: "insensitive" } }
        : {}),
    },
    include: { workspace: { select: { name: true } } },
    orderBy: [{ ratingCount: "desc" }, { createdAt: "desc" }],
    take: args.limit ?? 60,
  });

  // Pull existing pairings to annotate status.
  const ids = apps.map((a) => a.id);
  const pairings = await prisma.pairing.findMany({
    where: {
      OR: ids.map((id) => {
        const { appAId, appBId } = canonicalPair(self.id, id);
        return { appAId, appBId };
      }),
    },
  });
  const statusByApp = new Map<string, { status: string; id: string }>();
  for (const p of pairings) {
    const partner = p.appAId === self.id ? p.appBId : p.appAId;
    statusByApp.set(partner, { status: p.status, id: p.id });
  }

  return apps
    .filter((a) => {
      if (args.includeOverlap) return true;
      // Overlap guard: hide same-primary-category competitors by default.
      return !(self.category && a.category && self.category === a.category);
    })
    .map((a) => ({
      id: a.id,
      name: a.name,
      subtitle: a.subtitle,
      iconUrl: a.iconUrl,
      category: a.category,
      platform: a.platform,
      ratingAvg: a.ratingAvg,
      ratingCount: a.ratingCount,
      workspaceName: a.workspace.name,
      pairingStatus: statusByApp.get(a.id)?.status ?? null,
      pairingId: statusByApp.get(a.id)?.id ?? null,
    }));
}
