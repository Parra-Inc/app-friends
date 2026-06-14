import { prisma } from "@/prisma/client";
import { Prisma } from "@prisma/client";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { logger } from "@/lib/logger";

const log = logger("cron-rollup");
export const dynamic = "force-dynamic";

/**
 * Hourly housekeeping:
 *  - mark campaigns whose spend has reached budget as DEPLETED
 *  - end campaigns past their endsAt
 *  - activate scheduled campaigns whose startsAt has arrived
 *  - pause active campaigns whose advertiser wallet is empty
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const now = new Date();

  // Column-to-column comparison needs raw SQL.
  const depleted = await prisma.$executeRaw(
    Prisma.sql`UPDATE "Campaign" SET status = 'DEPLETED'
               WHERE status = 'ACTIVE' AND "spentCents" >= "totalBudgetCents"`
  );

  const [ended, started] = await Promise.all([
    prisma.campaign.updateMany({
      where: { status: { in: ["ACTIVE", "PAUSED"] }, endsAt: { lt: now } },
      data: { status: "ENDED" },
    }),
    prisma.campaign.updateMany({
      where: { status: "DRAFT", startsAt: { lte: now } },
      data: { status: "ACTIVE" },
    }),
  ]);

  const broke = await prisma.workspace.findMany({
    where: { walletCents: { lte: 0 }, campaigns: { some: { status: "ACTIVE" } } },
    select: { id: true },
  });
  let paused = 0;
  if (broke.length) {
    const res = await prisma.campaign.updateMany({
      where: { status: "ACTIVE", workspaceId: { in: broke.map((w) => w.id) } },
      data: { status: "PAUSED" },
    });
    paused = res.count;
  }

  const summary = {
    depleted,
    ended: ended.count,
    started: started.count,
    pausedForBalance: paused,
  };
  log.info("rollup complete", summary);
  return Response.json({ ok: true, ...summary });
}
