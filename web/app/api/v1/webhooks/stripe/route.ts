import type Stripe from "stripe";
import { prisma } from "@/prisma/client";
import {
  stripe,
  syncSubscriptionFromStripe,
  clearSubscription,
  creditWallet,
} from "@/lib/billing/stripe";
import { logger } from "@/lib/logger";

const log = logger("stripe-webhook");
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 503 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    log.error("signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Idempotency: skip events we've already processed.
  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId: event.id },
  });
  if (existing?.processedAt) return Response.json({ received: true });

  await prisma.webhookEvent.upsert({
    where: { eventId: event.id },
    update: {},
    create: { provider: "stripe", eventId: event.id, type: event.type },
  });

  try {
    await handle(event);
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { processedAt: new Date() },
    });
  } catch (err) {
    log.error(`handler failed for ${event.type}`, err);
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { error: String(err) },
    });
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.resumed":
      await syncSubscriptionFromStripe(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = sub.metadata?.workspaceId as string | undefined;
      if (workspaceId) await clearSubscription(workspaceId);
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (
        session.mode === "payment" &&
        session.metadata?.kind === "wallet_topup" &&
        session.metadata?.workspaceId
      ) {
        await creditWallet({
          workspaceId: session.metadata.workspaceId,
          amountCents:
            session.amount_total ??
            Number(session.metadata.amountCents ?? 0),
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? undefined),
        });
      }
      break;
    }
    default:
      log.debug(`unhandled event ${event.type}`);
  }
}
