import { assertApiUser } from "@/lib/auth/api-auth";
import { resolveWorkspaceBySlug } from "@/lib/auth/workspace";
import type { MemberRole, User, Membership, Workspace } from "@prisma/client";

export type WorkspaceContext = {
  user: User;
  membership: Membership;
  workspace: Workspace;
};

/**
 * Shared guard for server actions and server components: require a signed-in
 * user who is a member of `slug` meeting `role`. Throws AppFriendsError on miss.
 */
export async function requireWorkspace(
  slug: string,
  role: MemberRole | MemberRole[] = "MEMBER"
): Promise<WorkspaceContext> {
  const { user } = await assertApiUser();
  const resolved = await resolveWorkspaceBySlug(user.id, slug, role);
  return { user, membership: resolved, workspace: resolved.workspace };
}
