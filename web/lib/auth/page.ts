import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { findWorkspaceBySlug } from "@/lib/auth/workspace";
import type { Membership, Workspace } from "@prisma/client";

export type WorkspacePage = {
  userId: string;
  userName: string;
  userEmail: string;
  workspace: Workspace;
  membership: Membership;
};

/**
 * Page-friendly workspace guard: redirects to sign-in if logged out, 404s if the
 * user isn't a member of `slug`.
 */
export async function getWorkspacePage(slug: string): Promise<WorkspacePage> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=/dashboard/${slug}`);
  }
  const resolved = await findWorkspaceBySlug(session.user.id, slug);
  if (!resolved) notFound();
  return {
    userId: session.user.id,
    userName: session.user.name ?? "You",
    userEmail: session.user.email ?? "",
    workspace: resolved.workspace,
    membership: resolved,
  };
}
