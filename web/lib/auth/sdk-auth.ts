import { headers } from "next/headers";
import { prisma } from "@/prisma/client";
import { AppFriendsError } from "@/lib/errors";
import { hashApiKey, isSecret } from "@/lib/keys";
import type { ApiKey, Workspace } from "@prisma/client";

export type SdkAuth = {
  apiKey: ApiKey;
  workspace: Workspace;
  /** True for afs_ secret keys (full access), false for afp_ publishable keys. */
  secret: boolean;
};

/**
 * Authenticate an SDK request by API key. Accepts:
 *   Authorization: Bearer afp_…   (or afs_…)
 *   X-AppFriends-Key: afp_…
 *
 * Throws `unauthorized:sdk` when absent/invalid/revoked.
 */
export async function assertSdkKey(req: Request): Promise<SdkAuth> {
  const raw = extractKey(req);
  if (!raw) throw new AppFriendsError("unauthorized:sdk");

  const record = await prisma.apiKey.findUnique({
    where: { hash: hashApiKey(raw) },
    include: { workspace: true },
  });

  if (!record || record.revokedAt) {
    throw new AppFriendsError("unauthorized:sdk");
  }
  if (record.workspace.suspendedAt) {
    throw new AppFriendsError("forbidden:sdk", "Workspace suspended");
  }

  // Best-effort last-used stamp; never block the request on it.
  prisma.apiKey
    .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined);

  return {
    apiKey: record,
    workspace: record.workspace,
    secret: isSecret(raw),
  };
}

/** Require a secret (afs_) key — for server-to-server only operations. */
export async function assertSecretKey(req: Request): Promise<SdkAuth> {
  const result = await assertSdkKey(req);
  if (!result.secret) throw new AppFriendsError("forbidden:sdk");
  return result;
}

function extractKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const v = auth.slice(7).trim();
    if (v) return v;
  }
  const header = req.headers.get("x-appfriends-key");
  if (header?.trim()) return header.trim();
  return null;
}

/** Server-component variant using next/headers (no Request object). */
export async function readSdkKeyFromHeaders(): Promise<string | null> {
  const h = await headers();
  const auth = h.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim() || null;
  return h.get("x-appfriends-key");
}
