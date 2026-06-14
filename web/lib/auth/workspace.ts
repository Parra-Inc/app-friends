import { prisma } from "@/prisma/client";
import { AppFriendsError } from "@/lib/errors";
import type { MemberRole, Membership, Workspace } from "@prisma/client";

export type ResolvedWorkspace = Membership & { workspace: Workspace };

export async function getMembership(userId: string, workspaceId: string) {
  return prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    include: { workspace: true },
  });
}

/** Throws unless the user is a member of the workspace meeting the required role. */
export async function assertWorkspaceMember(
  userId: string,
  workspaceId: string,
  required: MemberRole | MemberRole[] = "MEMBER"
): Promise<ResolvedWorkspace> {
  const membership = await getMembership(userId, workspaceId);
  if (!membership) throw new AppFriendsError("forbidden:workspace");
  if (!roleMeets(membership.role, toList(required))) {
    throw new AppFriendsError("forbidden:workspace");
  }
  return membership;
}

/** Resolve a workspace by its URL slug, asserting membership. Throws on miss. */
export async function resolveWorkspaceBySlug(
  userId: string,
  slug: string,
  required: MemberRole | MemberRole[] = "MEMBER"
): Promise<ResolvedWorkspace> {
  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) throw new AppFriendsError("not_found:workspace");
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: workspace.id } },
  });
  if (!membership || !roleMeets(membership.role, toList(required))) {
    throw new AppFriendsError("forbidden:workspace");
  }
  return { ...membership, workspace };
}

/** Like resolveWorkspaceBySlug but returns null instead of throwing (for pages). */
export async function findWorkspaceBySlug(
  userId: string,
  slug: string
): Promise<ResolvedWorkspace | null> {
  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) return null;
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: workspace.id } },
  });
  if (!membership) return null;
  return { ...membership, workspace };
}

export function hasRole(role: MemberRole, required: MemberRole | MemberRole[]) {
  return roleMeets(role, toList(required));
}

function toList(r: MemberRole | MemberRole[]): MemberRole[] {
  return Array.isArray(r) ? r : [r];
}

function roleMeets(actual: MemberRole, required: MemberRole[]): boolean {
  const rank: Record<MemberRole, number> = { MEMBER: 1, ADMIN: 2, OWNER: 3 };
  const floor = Math.min(...required.map((r) => rank[r]));
  return rank[actual] >= floor;
}
