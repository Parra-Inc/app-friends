import { prisma } from "@/prisma/client";
import { AppFriendsError } from "@/lib/errors";

/**
 * Pairings store apps in canonical order (appAId < appBId) so a pair is unique
 * regardless of who initiated. This computes that ordering.
 */
export function canonicalPair(idX: string, idY: string) {
  const [appAId, appBId] = idX < idY ? [idX, idY] : [idY, idX];
  return { appAId, appBId };
}

export async function findPairing(idX: string, idY: string) {
  const { appAId, appBId } = canonicalPair(idX, idY);
  return prisma.pairing.findUnique({ where: { appAId_appBId: { appAId, appBId } } });
}

/**
 * Create a pairing request from `fromAppId` to `toAppId`. Both apps must exist,
 * belong to different workspaces, and not already be paired.
 */
export async function requestPairing(args: {
  fromAppId: string;
  toAppId: string;
  message?: string;
}) {
  if (args.fromAppId === args.toAppId) {
    throw new AppFriendsError("bad_request:pairing");
  }
  const [from, to] = await Promise.all([
    prisma.app.findUnique({ where: { id: args.fromAppId } }),
    prisma.app.findUnique({ where: { id: args.toAppId } }),
  ]);
  if (!from || !to) throw new AppFriendsError("not_found:app");
  if (from.workspaceId === to.workspaceId) {
    throw new AppFriendsError("conflict:pairing", "Can't pair two of your own apps");
  }

  const { appAId, appBId } = canonicalPair(from.id, to.id);
  const existing = await prisma.pairing.findUnique({
    where: { appAId_appBId: { appAId, appBId } },
  });
  if (existing) throw new AppFriendsError("conflict:pairing");

  return prisma.pairing.create({
    data: {
      appAId,
      appBId,
      status: "REQUESTED",
      requestedByAppId: from.id,
      message: args.message ?? null,
    },
  });
}

/** Respond to a pairing request (the recipient app's workspace decides). */
export async function respondToPairing(args: {
  pairingId: string;
  accept: boolean;
}) {
  const pairing = await prisma.pairing.findUnique({
    where: { id: args.pairingId },
  });
  if (!pairing) throw new AppFriendsError("not_found:pairing");
  return prisma.pairing.update({
    where: { id: pairing.id },
    data: {
      status: args.accept ? "ACTIVE" : "DECLINED",
      respondedAt: new Date(),
    },
  });
}

/** The partner app id for a given app within a pairing row. */
export function partnerAppId(
  pairing: { appAId: string; appBId: string },
  appId: string
): string {
  return pairing.appAId === appId ? pairing.appBId : pairing.appAId;
}
