"use server";

import { requireWorkspace } from "@/lib/auth/context";
import {
  createProCheckout,
  createWalletTopup,
  createPortalSession,
  stripeConfigured,
} from "@/lib/billing/stripe";
import { MIN_TOPUP_CENTS } from "@/lib/billing/plans";
import { ok, fail, runAction, type ActionResult } from "./result";

/** Returns a Stripe URL the client redirects to. */
export async function startProCheckout(
  slug: string
): Promise<ActionResult<{ url: string }>> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER"]);
    if (!stripeConfigured()) {
      return fail("Billing isn't configured on this deployment yet.");
    }
    const url = await createProCheckout({ workspaceId: workspace.id, slug });
    return ok({ url });
  });
}

export async function startWalletTopup(
  slug: string,
  input: { amountCents: number }
): Promise<ActionResult<{ url: string }>> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN"]);
    if (!stripeConfigured()) {
      return fail("Billing isn't configured on this deployment yet.");
    }
    if (input.amountCents < MIN_TOPUP_CENTS) {
      return fail(`Minimum top-up is $${MIN_TOPUP_CENTS / 100}.`);
    }
    const url = await createWalletTopup({
      workspaceId: workspace.id,
      slug,
      amountCents: Math.round(input.amountCents),
    });
    return ok({ url });
  });
}

export async function openBillingPortal(
  slug: string
): Promise<ActionResult<{ url: string }>> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN"]);
    if (!stripeConfigured()) {
      return fail("Billing isn't configured on this deployment yet.");
    }
    const url = await createPortalSession({ workspaceId: workspace.id, slug });
    return ok({ url });
  });
}
