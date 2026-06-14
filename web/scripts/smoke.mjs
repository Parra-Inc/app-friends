#!/usr/bin/env node
/**
 * Smoke test the SDK endpoints against a running server.
 *
 *   node scripts/smoke.mjs <publishableKey> [bundleId] [baseUrl]
 *
 * Get a key from `pnpm db:seed`.
 */

const [, , key, bundleId = "com.nimbuslabs.weather", base = "http://localhost:3050"] =
  process.argv;

if (!key) {
  console.error("usage: node scripts/smoke.mjs <publishableKey> [bundleId] [baseUrl]");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${key}` };

async function main() {
  console.log(`→ GET /api/v1/sdk/config`);
  const config = await fetch(`${base}/api/v1/sdk/config?bundleId=${bundleId}`, { headers });
  console.log(`  ${config.status}`, await config.json());

  console.log(`→ GET /api/v1/sdk/promotions`);
  const promosRes = await fetch(
    `${base}/api/v1/sdk/promotions?bundleId=${bundleId}&placement=POPUP&limit=5`,
    { headers }
  );
  const promos = await promosRes.json();
  console.log(`  ${promosRes.status} — ${promos.promos?.length ?? 0} promo(s)`);
  for (const p of promos.promos ?? []) {
    console.log(`    • ${p.appName} (${p.source})`);
  }

  const token = promos.promos?.[0]?.token;
  if (token) {
    console.log(`→ POST /api/v1/sdk/events (impression + tap)`);
    const ev = await fetch(`${base}/api/v1/sdk/events`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        events: [
          { token, type: "impression" },
          { token, type: "tap" },
        ],
      }),
    });
    console.log(`  ${ev.status}`, await ev.json());
  }

  console.log("\n✓ smoke test complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
