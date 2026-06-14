import Stripe from "stripe";
import { prisma } from "@/prisma/client";

let client: Stripe | undefined;

export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is required");
    client = new Stripe(key);
  }
  return client;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3050";
}

function proPriceId(): string {
  const id = process.env.STRIPE_PRICE_ID_PRO;
  if (!id) throw new Error("STRIPE_PRICE_ID_PRO is required");
  return id;
}

export async function ensureStripeCustomer(workspaceId: string): Promise<string> {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true, slug: true, stripeCustomerId: true },
  });
  if (!ws) throw new Error("Workspace not found");
  if (ws.stripeCustomerId) return ws.stripeCustomerId;

  const customer = await stripe().customers.create({
    name: ws.name,
    metadata: { workspaceId, slug: ws.slug },
  });
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

/** Checkout session to upgrade a workspace to Pro. */
export async function createProCheckout(args: {
  workspaceId: string;
  slug: string;
}): Promise<string> {
  const customer = await ensureStripeCustomer(args.workspaceId);
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: proPriceId(), quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: { metadata: { workspaceId: args.workspaceId } },
    success_url: `${siteUrl()}/dashboard/${encodeURIComponent(args.slug)}/billing?checkout=success`,
    cancel_url: `${siteUrl()}/dashboard/${encodeURIComponent(args.slug)}/billing?checkout=cancel`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

/** One-time checkout to top up the sponsored-spend wallet. */
export async function createWalletTopup(args: {
  workspaceId: string;
  slug: string;
  amountCents: number;
}): Promise<string> {
  const customer = await ensureStripeCustomer(args.workspaceId);
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: args.amountCents,
          product_data: { name: "App Friends — campaign credit" },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      metadata: { workspaceId: args.workspaceId, kind: "wallet_topup" },
    },
    metadata: {
      workspaceId: args.workspaceId,
      kind: "wallet_topup",
      amountCents: String(args.amountCents),
    },
    success_url: `${siteUrl()}/dashboard/${encodeURIComponent(args.slug)}/billing?topup=success`,
    cancel_url: `${siteUrl()}/dashboard/${encodeURIComponent(args.slug)}/billing?topup=cancel`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

export async function createPortalSession(args: {
  workspaceId: string;
  slug: string;
}): Promise<string> {
  const customer = await ensureStripeCustomer(args.workspaceId);
  const session = await stripe().billingPortal.sessions.create({
    customer,
    return_url: `${siteUrl()}/dashboard/${encodeURIComponent(args.slug)}/billing`,
  });
  return session.url;
}

/** Reconcile a Stripe subscription into our DB (Pro plan state). Idempotent. */
export async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription
): Promise<void> {
  const workspaceId = subscription.metadata?.workspaceId as string | undefined;
  if (!workspaceId) return;
  const item = subscription.items.data[0];
  if (!item) return;

  const periodEnd = new Date(
    (subscription as unknown as { current_period_end: number })
      .current_period_end * 1000
  );
  const active = ["active", "trialing"].includes(subscription.status);

  await prisma.$transaction([
    prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        plan: active ? "PRO" : "FREE",
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionCurrentPeriodEnd: periodEnd,
      },
    }),
    prisma.subscription.upsert({
      where: { workspaceId },
      update: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: item.price.id,
        status: subscription.status,
        currentPeriodEnd: periodEnd,
        cancelAt: subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000)
          : null,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
      },
      create: {
        workspaceId,
        stripeCustomerId:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: item.price.id,
        status: subscription.status,
        currentPeriodEnd: periodEnd,
      },
    }),
  ]);
}

export async function clearSubscription(workspaceId: string): Promise<void> {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      plan: "FREE",
      stripeSubscriptionId: null,
      subscriptionStatus: "canceled",
      subscriptionCurrentPeriodEnd: null,
    },
  });
  await prisma.subscription.deleteMany({ where: { workspaceId } });
}

/** Credit a workspace wallet after a successful top-up. Idempotent by intent id. */
export async function creditWallet(args: {
  workspaceId: string;
  amountCents: number;
  stripePaymentIntentId?: string;
}): Promise<void> {
  if (args.stripePaymentIntentId) {
    const existing = await prisma.ledgerEntry.findFirst({
      where: { stripePaymentIntentId: args.stripePaymentIntentId, type: "TOPUP" },
    });
    if (existing) return; // already credited
  }
  await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.update({
      where: { id: args.workspaceId },
      data: { walletCents: { increment: args.amountCents } },
      select: { walletCents: true },
    });
    await tx.ledgerEntry.create({
      data: {
        workspaceId: args.workspaceId,
        type: "TOPUP",
        amountCents: args.amountCents,
        balanceCents: ws.walletCents,
        description: "Wallet top-up",
        stripePaymentIntentId: args.stripePaymentIntentId ?? null,
      },
    });
  });
}
