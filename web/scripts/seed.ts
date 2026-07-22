import "dotenv/config";
import { prisma } from "../prisma/client";
import { generateApiKey } from "../lib/keys";
import { sha256 } from "../lib/crypto";
import { canonicalPair } from "../lib/network/pairings";

/**
 * Seed a small but complete network so you can sign in and actually use the
 * dashboard + SDK against real data. The centerpiece is a **sample tenant** you
 * own — a demo user, a PRO workspace ("Nimbus Labs"), and two registered apps —
 * surrounded by a few "friend" tenants that supply network inventory: an active
 * pairing, a pending pairing request, and a sponsored campaign approved to run
 * in one of your apps, plus a couple of weeks of analytics.
 *
 * Sign in locally with the demo email (magic link lands in MailHog), and point
 * the SDK at the stable publishable key printed below. Idempotent — re-running
 * upserts by stable id / slug / bundle id / key hash.
 */

// The sample tenant's owner. Sign in at /auth/signin with this email; the magic
// link is delivered to MailHog (http://localhost:8055).
const DEMO_USER = {
  id: "usr_demo_owner",
  email: "demo@appfriends.dev",
  name: "Demo Developer",
};

// A fixed publishable key for the sample tenant so a sample app can hard-code
// it and it survives reseeds (real keys are random and shown exactly once).
// Dev only — never ship a checked-in key to production.
const SAMPLE_PUBLISHABLE_KEY = "afp_dev_sample_publishable_key_00000001";

async function ensureWorkspace(slug: string, name: string, plan: "FREE" | "PRO") {
  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (existing) return existing;
  return prisma.workspace.create({
    data: { slug, name, plan, walletCents: plan === "PRO" ? 50000 : 0 },
  });
}

/**
 * Upsert the demo user and make them OWNER of the sample workspace. With this in
 * place you can sign in (email magic link → MailHog) and land straight in the
 * seeded workspace, instead of an empty personal one.
 */
async function ensureDemoOwner(workspaceId: string) {
  // One-time migration: a prior seed (or normal sign-in) may have created this
  // email with a random id. Drop it so the stable id below takes over cleanly.
  const existingByEmail = await prisma.user.findUnique({
    where: { email: DEMO_USER.email },
    select: { id: true },
  });
  if (existingByEmail && existingByEmail.id !== DEMO_USER.id) {
    await prisma.user.delete({ where: { id: existingByEmail.id } });
  }

  const user = await prisma.user.upsert({
    where: { id: DEMO_USER.id },
    update: { email: DEMO_USER.email, name: DEMO_USER.name, emailVerified: new Date() },
    create: {
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      emailVerified: new Date(),
    },
  });

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });
  if (!membership) {
    await prisma.membership.create({
      data: { userId: user.id, workspaceId, role: "OWNER" },
    });
  } else if (membership.role !== "OWNER") {
    await prisma.membership.update({
      where: { id: membership.id },
      data: { role: "OWNER" },
    });
  }

  return user;
}

async function ensureApp(args: {
  workspaceId: string;
  bundleId: string;
  name: string;
  subtitle: string;
  category: string;
  headline: string;
  icon: string;
}) {
  const existing = await prisma.app.findUnique({
    where: { platform_bundleId: { platform: "IOS", bundleId: args.bundleId } },
  });
  if (existing) return existing;
  return prisma.app.create({
    data: {
      workspaceId: args.workspaceId,
      bundleId: args.bundleId,
      platform: "IOS",
      name: args.name,
      subtitle: args.subtitle,
      category: args.category,
      promoHeadline: args.headline,
      promoSubtitle: args.subtitle,
      iconUrl: args.icon,
      storeUrl: `https://apps.apple.com/app/${args.bundleId}`,
      ratingAvg: 4.7,
      ratingCount: 842,
      promoScreenshots: [],
    },
  });
}

/**
 * Upsert a publishable key with a known raw value so it's stable across reseeds
 * and printable every time. We store only the sha-256 hash (same as real keys);
 * the raw value is the constant above.
 */
async function ensureStablePublishableKey(workspaceId: string, raw: string) {
  const hash = sha256(raw);
  await prisma.apiKey.upsert({
    where: { hash },
    update: { workspaceId, revokedAt: null },
    create: {
      workspaceId,
      scope: "PUBLISHABLE",
      hash,
      prefix: raw.slice(0, 8),
      label: "Sample (seed)",
    },
  });
  return raw;
}

async function ensureActivePairing(appXId: string, appYId: string) {
  const { appAId, appBId } = canonicalPair(appXId, appYId);
  const existing = await prisma.pairing.findUnique({
    where: { appAId_appBId: { appAId, appBId } },
  });
  if (existing) {
    if (existing.status !== "ACTIVE") {
      await prisma.pairing.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", respondedAt: new Date() },
      });
    }
    return existing;
  }
  return prisma.pairing.create({
    data: {
      appAId,
      appBId,
      status: "ACTIVE",
      requestedByAppId: appXId,
      respondedAt: new Date(),
    },
  });
}

/** A pending pairing request FROM `fromAppId` TO `toAppId` (shows up as an
 *  incoming request the sample tenant can accept or decline). */
async function ensureRequestedPairing(fromAppId: string, toAppId: string, message: string) {
  const { appAId, appBId } = canonicalPair(fromAppId, toAppId);
  const existing = await prisma.pairing.findUnique({
    where: { appAId_appBId: { appAId, appBId } },
  });
  if (existing) return existing;
  return prisma.pairing.create({
    data: {
      appAId,
      appBId,
      status: "REQUESTED",
      requestedByAppId: fromAppId,
      message,
    },
  });
}

/** A couple of weeks of believable publisher + promoted analytics for an app. */
async function seedDailyStats(appId: string, days = 14) {
  for (let i = 0; i < days; i++) {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() - i);
    day.setUTCHours(0, 0, 0, 0);
    const impressions = 40 + Math.round(Math.sin(i) * 20 + 30);
    await prisma.dailyStat
      .upsert({
        where: {
          day_appId_role_source: { day, appId, role: "PUBLISHER", source: "PAIRING" },
        },
        update: {},
        create: {
          day,
          appId,
          role: "PUBLISHER",
          source: "PAIRING",
          impressions,
          taps: Math.round(impressions * 0.18),
          installs: Math.round(impressions * 0.05),
        },
      })
      .catch(() => undefined);
    await prisma.dailyStat
      .upsert({
        where: {
          day_appId_role_source: { day, appId, role: "PROMOTED", source: "PAIRING" },
        },
        update: {},
        create: {
          day,
          appId,
          role: "PROMOTED",
          source: "PAIRING",
          impressions: Math.max(0, impressions - 5),
          taps: Math.round(impressions * 0.2),
          installs: Math.round(impressions * 0.06),
        },
      })
      .catch(() => undefined);
  }
}

async function main() {
  console.log("Seeding App Friends…\n");

  // The sample tenant (you own this) + friend tenants (other developers).
  const nimbus = await ensureWorkspace("nimbus-labs", "Nimbus Labs", "PRO");
  const habit = await ensureWorkspace("habit-co", "Habit Co", "FREE");
  const advertiser = await ensureWorkspace("brightwords", "Brightwords", "PRO");
  const ledger = await ensureWorkspace("ledgerly", "Ledgerly", "FREE");

  // Make Nimbus Labs the sample tenant you can sign in to.
  await ensureDemoOwner(nimbus.id);

  // Two sample apps under your workspace.
  const weatherApp = await ensureApp({
    workspaceId: nimbus.id,
    bundleId: "com.nimbuslabs.weather",
    name: "Nimbus Weather",
    subtitle: "The forecast, finally calm",
    category: "Weather",
    headline: "Weather without the noise",
    icon: "https://placehold.co/512x512/6D4AFF/FFFFFF/png?text=N",
  });

  const notesApp = await ensureApp({
    workspaceId: nimbus.id,
    bundleId: "com.nimbuslabs.notes",
    name: "Nimbus Notes",
    subtitle: "Notes that sync everywhere",
    category: "Productivity",
    headline: "Capture it before it's gone",
    icon: "https://placehold.co/512x512/4A6CFF/FFFFFF/png?text=NN",
  });

  // Friend apps (other developers) that feed the network.
  const gardenApp = await ensureApp({
    workspaceId: habit.id,
    bundleId: "com.habitco.garden",
    name: "Habit Garden",
    subtitle: "Grow one good habit",
    category: "Health & Fitness",
    headline: "Build habits that stick",
    icon: "https://placehold.co/512x512/16A34A/FFFFFF/png?text=H",
  });

  const readerApp = await ensureApp({
    workspaceId: advertiser.id,
    bundleId: "com.brightwords.reader",
    name: "Brightwords",
    subtitle: "Read more, every day",
    category: "Books",
    headline: "Finish more books",
    icon: "https://placehold.co/512x512/FF6B5E/FFFFFF/png?text=B",
  });

  const ledgerApp = await ensureApp({
    workspaceId: ledger.id,
    bundleId: "com.ledgerly.app",
    name: "Ledgerly",
    subtitle: "Money, minus the spreadsheet",
    category: "Finance",
    headline: "See where it all goes",
    icon: "https://placehold.co/512x512/0EA5E9/FFFFFF/png?text=L",
  });

  // Active pairing: Nimbus Weather ⇄ Habit Garden (non-competing).
  await ensureActivePairing(weatherApp.id, gardenApp.id);

  // Pending incoming request: Ledgerly wants to pair with Nimbus Weather.
  await ensureRequestedPairing(
    ledgerApp.id,
    weatherApp.id,
    "Love Nimbus — want to trade installs? Finance + Weather, no overlap."
  );

  // A sponsored campaign from Brightwords, approved to run in Nimbus Weather.
  let campaign = await prisma.campaign.findFirst({
    where: { workspaceId: advertiser.id, appId: readerApp.id },
  });
  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        workspaceId: advertiser.id,
        appId: readerApp.id,
        name: "Brightwords launch",
        pricingModel: "CPI",
        bidCents: 180,
        totalBudgetCents: 50000,
        status: "ACTIVE",
        targetCategories: [],
        targetPlatforms: ["IOS"],
      },
    });
  }
  await prisma.adApproval.upsert({
    where: {
      publisherAppId_campaignId: {
        publisherAppId: weatherApp.id,
        campaignId: campaign.id,
      },
    },
    update: { status: "APPROVED", decidedAt: new Date() },
    create: {
      publisherAppId: weatherApp.id,
      publisherWorkspaceId: nimbus.id,
      campaignId: campaign.id,
      status: "APPROVED",
      decidedAt: new Date(),
    },
  });

  // Analytics history for both of the sample tenant's apps.
  await seedDailyStats(weatherApp.id, 14);
  await seedDailyStats(notesApp.id, 14);

  const sampleKey = await ensureStablePublishableKey(nimbus.id, SAMPLE_PUBLISHABLE_KEY);
  // A revealed-once random key for a friend tenant, in case you want a second.
  const habitKey = await ensureRandomPublishableKey(habit.id);

  console.log("Tenants:");
  console.log("  • Nimbus Labs   (sample — you own this)   PRO");
  console.log("  • Habit Co / Brightwords / Ledgerly       friends");
  console.log("\nSample tenant apps:");
  console.log(`  • Nimbus Weather   ${weatherApp.bundleId}`);
  console.log(`  • Nimbus Notes     ${notesApp.bundleId}`);
  console.log("\nNetwork:");
  console.log("  • Pairing   Nimbus Weather ⇄ Habit Garden (ACTIVE)");
  console.log("  • Request   Ledgerly → Nimbus Weather (PENDING)");
  console.log("  • Campaign  Brightwords → approved in Nimbus Weather (CPI $1.80)");

  console.log("\n── Sign in ──────────────────────────────────────────────");
  console.log(`  Email:    ${DEMO_USER.email}`);
  console.log("  1. Open   http://localhost:3053/auth/signin");
  console.log(`  2. Enter  ${DEMO_USER.email}  → "Send link"`);
  console.log("  3. Click the magic link in MailHog: http://localhost:8055");
  console.log("     (lands in the Nimbus Labs workspace)");

  console.log("\n── SDK / sample app ─────────────────────────────────────");
  console.log(`  Publishable key:  ${sampleKey}`);
  console.log("  Try it:");
  console.log(`    curl -H 'Authorization: Bearer ${sampleKey}' \\`);
  console.log(
    "      'http://localhost:3053/api/v1/sdk/promotions?bundleId=com.nimbuslabs.weather'"
  );
  if (habitKey) {
    console.log(`\n  (Habit Co publishable key, shown once: ${habitKey})`);
  }

  console.log("\nDone.");
}

/** A random, revealed-once publishable key (real-world behavior). Returns null
 *  if the workspace already has one (we can't recover the raw value). */
async function ensureRandomPublishableKey(workspaceId: string) {
  const existing = await prisma.apiKey.findFirst({
    where: { workspaceId, scope: "PUBLISHABLE", revokedAt: null },
  });
  if (existing) return null;
  const { raw, hash, prefix } = generateApiKey("PUBLISHABLE");
  await prisma.apiKey.create({
    data: { workspaceId, scope: "PUBLISHABLE", hash, prefix, label: "Seed key" },
  });
  return raw;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
