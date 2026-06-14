"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/prisma/client";
import { requireWorkspace } from "@/lib/auth/context";
import { lookupByBundleId, lookupByStoreId } from "@/lib/appstore/lookup";
import { planLimits } from "@/lib/billing/plans";
import { ok, fail, runAction, type ActionResult } from "./result";
import type { Platform } from "@prisma/client";

async function assertCanAddApp(workspaceId: string, plan: "FREE" | "PRO") {
  const count = await prisma.app.count({ where: { workspaceId } });
  if (count >= planLimits(plan).maxApps) {
    return false;
  }
  return true;
}

export async function importApp(
  slug: string,
  input: { lookup: string; platform?: Platform }
): Promise<ActionResult<{ appId: string }>> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN", "MEMBER"]);
    if (!(await assertCanAddApp(workspace.id, workspace.plan))) {
      return fail("You've hit the app limit for the Free plan. Upgrade to add more.");
    }

    const value = input.lookup.trim();
    if (!value) return fail("Enter a bundle id or App Store id.");

    const meta = /^\d+$/.test(value)
      ? await lookupByStoreId(value)
      : await lookupByBundleId(value);
    if (!meta) {
      return fail("Couldn't find that app on the App Store. Add it manually instead.");
    }

    const platform = input.platform ?? "IOS";
    const existing = await prisma.app.findUnique({
      where: { platform_bundleId: { platform, bundleId: meta.bundleId } },
    });
    if (existing) return fail("That app is already registered on App Friends.");

    const app = await prisma.app.create({
      data: {
        workspaceId: workspace.id,
        bundleId: meta.bundleId,
        platform,
        name: meta.name,
        subtitle: meta.subtitle,
        iconUrl: meta.iconUrl,
        storeUrl: meta.storeUrl,
        storeId: meta.storeId,
        category: meta.category,
        ratingAvg: meta.ratingAvg,
        ratingCount: meta.ratingCount,
        promoScreenshots: meta.screenshots,
        promoHeadline: meta.subtitle,
      },
    });
    revalidatePath(`/dashboard/${slug}/apps`);
    return ok({ appId: app.id });
  });
}

export async function createAppManual(
  slug: string,
  input: {
    name: string;
    bundleId: string;
    platform: Platform;
    subtitle?: string;
    storeUrl?: string;
    category?: string;
    iconUrl?: string;
  }
): Promise<ActionResult<{ appId: string }>> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN", "MEMBER"]);
    if (!(await assertCanAddApp(workspace.id, workspace.plan))) {
      return fail("You've hit the app limit for the Free plan. Upgrade to add more.");
    }
    if (!input.name.trim() || !input.bundleId.trim()) {
      return fail("Name and bundle id are required.");
    }
    const existing = await prisma.app.findUnique({
      where: {
        platform_bundleId: {
          platform: input.platform,
          bundleId: input.bundleId.trim(),
        },
      },
    });
    if (existing) return fail("An app with that bundle id already exists.");

    const app = await prisma.app.create({
      data: {
        workspaceId: workspace.id,
        name: input.name.trim(),
        bundleId: input.bundleId.trim(),
        platform: input.platform,
        subtitle: input.subtitle?.trim() || null,
        storeUrl: input.storeUrl?.trim() || null,
        category: input.category || null,
        iconUrl: input.iconUrl?.trim() || null,
        promoHeadline: input.subtitle?.trim() || null,
      },
    });
    revalidatePath(`/dashboard/${slug}/apps`);
    return ok({ appId: app.id });
  });
}

export async function updateApp(
  slug: string,
  appId: string,
  input: {
    name?: string;
    subtitle?: string;
    category?: string;
    promoHeadline?: string;
    promoSubtitle?: string;
    storeUrl?: string;
    iconUrl?: string;
    acceptsPairings?: boolean;
    acceptsSponsored?: boolean;
    status?: "ACTIVE" | "PAUSED";
  }
): Promise<ActionResult> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN", "MEMBER"]);
    const app = await prisma.app.findFirst({
      where: { id: appId, workspaceId: workspace.id },
    });
    if (!app) return fail("App not found.");

    await prisma.app.update({
      where: { id: app.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.subtitle !== undefined ? { subtitle: input.subtitle.trim() || null } : {}),
        ...(input.category !== undefined ? { category: input.category || null } : {}),
        ...(input.promoHeadline !== undefined ? { promoHeadline: input.promoHeadline.trim() || null } : {}),
        ...(input.promoSubtitle !== undefined ? { promoSubtitle: input.promoSubtitle.trim() || null } : {}),
        ...(input.storeUrl !== undefined ? { storeUrl: input.storeUrl.trim() || null } : {}),
        ...(input.iconUrl !== undefined ? { iconUrl: input.iconUrl.trim() || null } : {}),
        ...(input.acceptsPairings !== undefined ? { acceptsPairings: input.acceptsPairings } : {}),
        ...(input.acceptsSponsored !== undefined ? { acceptsSponsored: input.acceptsSponsored } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
    revalidatePath(`/dashboard/${slug}/apps/${appId}`);
    revalidatePath(`/dashboard/${slug}/apps`);
    return ok();
  });
}

export async function deleteApp(
  slug: string,
  appId: string
): Promise<ActionResult> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN"]);
    const app = await prisma.app.findFirst({
      where: { id: appId, workspaceId: workspace.id },
    });
    if (!app) return fail("App not found.");
    await prisma.app.delete({ where: { id: app.id } });
    revalidatePath(`/dashboard/${slug}/apps`);
    return ok();
  });
}
