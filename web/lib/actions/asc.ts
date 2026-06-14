"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/prisma/client";
import { requireWorkspace } from "@/lib/auth/context";
import { encryptSecret } from "@/lib/crypto";
import { validateAscCredential, listAscApps, type AscApp } from "@/lib/appstore/asc";
import { lookupByBundleId } from "@/lib/appstore/lookup";
import { planLimits } from "@/lib/billing/plans";
import { ok, fail, runAction, type ActionResult } from "./result";

export async function connectAsc(
  slug: string,
  input: { issuerId: string; keyId: string; privateKeyPem: string; label?: string }
): Promise<ActionResult<{ credentialId: string }>> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN"]);
    if (!input.issuerId.trim() || !input.keyId.trim() || !input.privateKeyPem.trim()) {
      return fail("Issuer id, key id, and the .p8 contents are all required.");
    }

    const valid = await validateAscCredential({
      issuerId: input.issuerId.trim(),
      keyId: input.keyId.trim(),
      privateKeyPem: input.privateKeyPem,
    });
    if (!valid) {
      return fail("Those credentials didn't work against App Store Connect.");
    }

    const cred = await prisma.ascCredential.create({
      data: {
        workspaceId: workspace.id,
        issuerId: input.issuerId.trim(),
        keyId: input.keyId.trim(),
        privateKeyEnc: encryptSecret(input.privateKeyPem),
        label: input.label?.trim() || null,
        lastSyncedAt: new Date(),
      },
    });
    revalidatePath(`/dashboard/${slug}/apps`);
    return ok({ credentialId: cred.id });
  });
}

export async function listConnectAppsAction(
  slug: string,
  input: { credentialId: string }
): Promise<ActionResult<{ apps: AscApp[] }>> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN", "MEMBER"]);
    const cred = await prisma.ascCredential.findFirst({
      where: { id: input.credentialId, workspaceId: workspace.id },
    });
    if (!cred) return fail("Connection not found.");
    const apps = await listAscApps(cred.id);
    return ok({ apps });
  });
}

export async function importAscApp(
  slug: string,
  input: { ascAppId: string; bundleId: string; name: string }
): Promise<ActionResult<{ appId: string }>> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN", "MEMBER"]);
    const count = await prisma.app.count({ where: { workspaceId: workspace.id } });
    if (count >= planLimits(workspace.plan).maxApps) {
      return fail("You've hit the app limit for the Free plan. Upgrade to add more.");
    }

    const existing = await prisma.app.findUnique({
      where: { platform_bundleId: { platform: "IOS", bundleId: input.bundleId } },
    });
    if (existing) return fail("That app is already on App Friends.");

    // Enrich with public metadata (icon, screenshots, rating, category).
    const meta = await lookupByBundleId(input.bundleId);

    const app = await prisma.app.create({
      data: {
        workspaceId: workspace.id,
        bundleId: input.bundleId,
        platform: "IOS",
        name: meta?.name ?? input.name,
        subtitle: meta?.subtitle ?? null,
        iconUrl: meta?.iconUrl ?? null,
        storeUrl: meta?.storeUrl ?? null,
        storeId: meta?.storeId ?? null,
        category: meta?.category ?? null,
        ratingAvg: meta?.ratingAvg ?? null,
        ratingCount: meta?.ratingCount ?? null,
        promoScreenshots: meta?.screenshots ?? [],
        promoHeadline: meta?.subtitle ?? null,
        ascAppId: input.ascAppId,
      },
    });
    revalidatePath(`/dashboard/${slug}/apps`);
    return ok({ appId: app.id });
  });
}
