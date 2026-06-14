import { auth } from "@/auth";
import { prisma } from "@/prisma/client";
import { AppFriendsError } from "@/lib/errors";
import type { User } from "@prisma/client";

export type SessionAuth = { user: User };

/**
 * Resolve the signed-in dashboard user. Throws `unauthorized:auth` if there's no
 * valid session, so callers can `try { ... } catch (e) { return e.toResponse() }`
 * or wrap with `handleRoute`.
 */
export async function assertApiUser(): Promise<SessionAuth> {
  const session = await auth();
  if (!session?.user?.id) throw new AppFriendsError("unauthorized:auth");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new AppFriendsError("unauthorized:auth");
  return { user };
}

/** Non-throwing variant for layouts/pages that prefer to redirect. */
export async function getApiUser(): Promise<User | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
