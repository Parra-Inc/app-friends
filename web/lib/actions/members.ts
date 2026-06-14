"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/prisma/client";
import { requireWorkspace } from "@/lib/auth/context";
import { inviteMember as inviteMemberService } from "@/lib/members/service";
import { ok, fail, runAction, type ActionResult } from "./result";
import type { MemberRole } from "@prisma/client";

export async function inviteMember(
  slug: string,
  input: { email: string; role: MemberRole }
): Promise<ActionResult> {
  return runAction(async () => {
    const { user, workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN"]);
    if (!input.email.includes("@")) return fail("Enter a valid email.");
    await inviteMemberService({
      workspaceId: workspace.id,
      email: input.email,
      role: input.role,
      invitedById: user.id,
      inviterName: user.name || user.email,
      workspaceName: workspace.name,
    });
    revalidatePath(`/dashboard/${slug}/settings`);
    return ok();
  });
}

export async function changeMemberRole(
  slug: string,
  input: { membershipId: string; role: MemberRole }
): Promise<ActionResult> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER"]);
    const membership = await prisma.membership.findFirst({
      where: { id: input.membershipId, workspaceId: workspace.id },
    });
    if (!membership) return fail("Member not found.");
    await prisma.membership.update({
      where: { id: membership.id },
      data: { role: input.role },
    });
    revalidatePath(`/dashboard/${slug}/settings`);
    return ok();
  });
}

export async function removeMember(
  slug: string,
  input: { membershipId: string }
): Promise<ActionResult> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER"]);
    const membership = await prisma.membership.findFirst({
      where: { id: input.membershipId, workspaceId: workspace.id },
    });
    if (!membership) return fail("Member not found.");

    // Don't allow removing the last owner.
    if (membership.role === "OWNER") {
      const owners = await prisma.membership.count({
        where: { workspaceId: workspace.id, role: "OWNER" },
      });
      if (owners <= 1) return fail("A workspace needs at least one owner.");
    }
    await prisma.membership.delete({ where: { id: membership.id } });
    revalidatePath(`/dashboard/${slug}/settings`);
    return ok();
  });
}

export async function revokeInvitation(
  slug: string,
  input: { invitationId: string }
): Promise<ActionResult> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN"]);
    await prisma.invitation.deleteMany({
      where: { id: input.invitationId, workspaceId: workspace.id },
    });
    revalidatePath(`/dashboard/${slug}/settings`);
    return ok();
  });
}
