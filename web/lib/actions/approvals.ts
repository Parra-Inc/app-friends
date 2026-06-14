"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/prisma/client";
import { requireWorkspace } from "@/lib/auth/context";
import { ok, fail, runAction, type ActionResult } from "./result";
import type { ApprovalStatus } from "@prisma/client";

/**
 * A publisher decides whether a campaign may run inside one of their apps.
 * Creates the AdApproval row on first decision; updates it thereafter.
 */
export async function decideApproval(
  slug: string,
  input: { publisherAppId: string; campaignId: string; status: ApprovalStatus }
): Promise<ActionResult> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN"]);
    const app = await prisma.app.findFirst({
      where: { id: input.publisherAppId, workspaceId: workspace.id },
    });
    if (!app) return fail("That isn't one of your apps.");

    const campaign = await prisma.campaign.findUnique({
      where: { id: input.campaignId },
    });
    if (!campaign) return fail("Campaign not found.");

    await prisma.adApproval.upsert({
      where: {
        publisherAppId_campaignId: {
          publisherAppId: app.id,
          campaignId: campaign.id,
        },
      },
      update: { status: input.status, decidedAt: new Date() },
      create: {
        publisherAppId: app.id,
        publisherWorkspaceId: workspace.id,
        campaignId: campaign.id,
        status: input.status,
        decidedAt: new Date(),
      },
    });
    revalidatePath(`/dashboard/${slug}/network`);
    return ok();
  });
}
