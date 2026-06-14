"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/prisma/client";
import { requireWorkspace } from "@/lib/auth/context";
import { planLimits } from "@/lib/billing/plans";
import { ok, fail, runAction, type ActionResult } from "./result";
import type { CampaignStatus, Platform, PricingModel } from "@prisma/client";

export async function createCampaign(
  slug: string,
  input: {
    name: string;
    appId: string;
    pricingModel: PricingModel;
    bidCents: number;
    totalBudgetCents: number;
    dailyBudgetCents?: number;
    targetCategories?: string[];
    targetPlatforms?: Platform[];
    targetCountries?: string[];
  }
): Promise<ActionResult<{ campaignId: string }>> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN"]);
    if (!planLimits(workspace.plan).canRunCampaigns) {
      return fail("Running sponsored campaigns requires the Pro plan.");
    }
    const app = await prisma.app.findFirst({
      where: { id: input.appId, workspaceId: workspace.id },
    });
    if (!app) return fail("Pick one of your apps to advertise.");
    if (input.bidCents <= 0) return fail("Set a bid greater than $0.");
    if (input.totalBudgetCents < input.bidCents) {
      return fail("Total budget must be at least one bid.");
    }

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: workspace.id,
        appId: app.id,
        name: input.name.trim() || `${app.name} campaign`,
        pricingModel: input.pricingModel,
        bidCents: input.bidCents,
        totalBudgetCents: input.totalBudgetCents,
        dailyBudgetCents: input.dailyBudgetCents ?? null,
        targetCategories: input.targetCategories ?? [],
        targetPlatforms: input.targetPlatforms ?? [],
        targetCountries: input.targetCountries ?? [],
        status: "DRAFT",
      },
    });
    revalidatePath(`/dashboard/${slug}/campaigns`);
    return ok({ campaignId: campaign.id });
  });
}

export async function setCampaignStatus(
  slug: string,
  input: { campaignId: string; status: CampaignStatus }
): Promise<ActionResult> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN"]);
    const campaign = await prisma.campaign.findFirst({
      where: { id: input.campaignId, workspaceId: workspace.id },
    });
    if (!campaign) return fail("Campaign not found.");

    // Going live needs wallet headroom.
    if (input.status === "ACTIVE") {
      const ws = await prisma.workspace.findUnique({
        where: { id: workspace.id },
        select: { walletCents: true },
      });
      if ((ws?.walletCents ?? 0) <= 0) {
        return fail("Top up your wallet before activating a campaign.");
      }
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: input.status },
    });
    revalidatePath(`/dashboard/${slug}/campaigns`);
    revalidatePath(`/dashboard/${slug}/campaigns/${campaign.id}`);
    return ok();
  });
}

export async function updateCampaign(
  slug: string,
  input: {
    campaignId: string;
    name?: string;
    bidCents?: number;
    totalBudgetCents?: number;
    dailyBudgetCents?: number | null;
    targetCategories?: string[];
    targetPlatforms?: Platform[];
  }
): Promise<ActionResult> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN"]);
    const campaign = await prisma.campaign.findFirst({
      where: { id: input.campaignId, workspaceId: workspace.id },
    });
    if (!campaign) return fail("Campaign not found.");

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.bidCents !== undefined ? { bidCents: input.bidCents } : {}),
        ...(input.totalBudgetCents !== undefined ? { totalBudgetCents: input.totalBudgetCents } : {}),
        ...(input.dailyBudgetCents !== undefined ? { dailyBudgetCents: input.dailyBudgetCents } : {}),
        ...(input.targetCategories !== undefined ? { targetCategories: input.targetCategories } : {}),
        ...(input.targetPlatforms !== undefined ? { targetPlatforms: input.targetPlatforms } : {}),
      },
    });
    revalidatePath(`/dashboard/${slug}/campaigns/${campaign.id}`);
    return ok();
  });
}
