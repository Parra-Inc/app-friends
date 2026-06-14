import { prisma } from "@/prisma/client";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { logger } from "@/lib/logger";

const log = logger("cron-settle");
export const dynamic = "force-dynamic";

/**
 * Nightly settlement: reconcile each workspace's ledger running balances against
 * the live wallet balance, so the billing page's ledger column is accurate even
 * if a live `recordEvent` wrote a SPEND entry with a placeholder balance.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const workspaces = await prisma.workspace.findMany({
    where: { ledgerEntries: { some: {} } },
    select: { id: true },
  });

  let reconciled = 0;
  for (const ws of workspaces) {
    const entries = await prisma.ledgerEntry.findMany({
      where: { workspaceId: ws.id },
      orderBy: { createdAt: "asc" },
    });
    let running = 0;
    for (const e of entries) {
      running += e.amountCents;
      if (e.balanceCents !== running) {
        await prisma.ledgerEntry.update({
          where: { id: e.id },
          data: { balanceCents: running },
        });
      }
    }
    // Keep the workspace wallet authoritative against the ledger.
    await prisma.workspace.update({
      where: { id: ws.id },
      data: { walletCents: Math.max(0, running) },
    });
    reconciled += 1;
  }

  log.info(`settled ${reconciled} workspaces`);
  return Response.json({ ok: true, reconciled });
}
