"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/prisma/client";
import { requireWorkspace } from "@/lib/auth/context";
import {
  requestPairing,
  respondToPairing,
  partnerAppId,
} from "@/lib/network/pairings";
import { sendEmail } from "@/lib/email/email-service";
import { pairingRequestEmail } from "@/lib/email/templates";
import { ok, fail, runAction, type ActionResult } from "./result";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3050";

export async function sendPairingRequest(
  slug: string,
  input: { fromAppId: string; toAppId: string; message?: string }
): Promise<ActionResult> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN", "MEMBER"]);
    const from = await prisma.app.findFirst({
      where: { id: input.fromAppId, workspaceId: workspace.id },
    });
    if (!from) return fail("Pick one of your apps to pair from.");

    await requestPairing({
      fromAppId: from.id,
      toAppId: input.toAppId,
      message: input.message,
    });

    // Notify the recipient workspace's owners.
    const toApp = await prisma.app.findUnique({
      where: { id: input.toAppId },
      include: {
        workspace: {
          include: {
            memberships: {
              where: { role: { in: ["OWNER", "ADMIN"] } },
              include: { user: { select: { email: true } } },
            },
          },
        },
      },
    });
    if (toApp) {
      const { subject, html } = pairingRequestEmail({
        fromAppName: from.name,
        toAppName: toApp.name,
        message: input.message,
        reviewUrl: `${SITE}/dashboard/${toApp.workspace.slug}/network`,
      });
      for (const m of toApp.workspace.memberships) {
        if (m.user.email) await sendEmail({ to: m.user.email, subject, html });
      }
    }

    revalidatePath(`/dashboard/${slug}/network`);
    return ok();
  });
}

export async function respondPairing(
  slug: string,
  input: { pairingId: string; accept: boolean }
): Promise<ActionResult> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN", "MEMBER"]);
    const pairing = await prisma.pairing.findUnique({
      where: { id: input.pairingId },
      include: { appA: true, appB: true },
    });
    if (!pairing) return fail("Pairing not found.");

    // Only the *recipient* workspace may accept/decline.
    const recipientAppId = partnerAppId(pairing, pairing.requestedByAppId);
    const recipientApp =
      pairing.appA.id === recipientAppId ? pairing.appA : pairing.appB;
    if (recipientApp.workspaceId !== workspace.id) {
      return fail("Only the invited app can respond to this request.");
    }

    await respondToPairing({ pairingId: pairing.id, accept: input.accept });
    revalidatePath(`/dashboard/${slug}/network`);
    return ok();
  });
}

export async function setPairingPaused(
  slug: string,
  input: { pairingId: string; paused: boolean }
): Promise<ActionResult> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN", "MEMBER"]);
    const pairing = await prisma.pairing.findUnique({
      where: { id: input.pairingId },
      include: { appA: true, appB: true },
    });
    if (!pairing) return fail("Pairing not found.");
    const mine =
      pairing.appA.workspaceId === workspace.id ||
      pairing.appB.workspaceId === workspace.id;
    if (!mine) return fail("Not your pairing.");

    await prisma.pairing.update({
      where: { id: pairing.id },
      data: { status: input.paused ? "PAUSED" : "ACTIVE" },
    });
    revalidatePath(`/dashboard/${slug}/network`);
    return ok();
  });
}
