import { assertSdkKey } from "@/lib/auth/sdk-auth";
import { prisma } from "@/prisma/client";
import { handleRoute } from "@/lib/errors";
import { corsJson, corsPreflight } from "@/lib/sdk/cors";
import { SDK_DEFAULTS, type SdkConfig } from "@/lib/sdk/contract";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request) {
  return handleRoute(async () => {
    const { workspace } = await assertSdkKey(req);

    const url = new URL(req.url);
    const bundleId = url.searchParams.get("bundleId")?.trim();

    // "enabled" reflects whether there's any inventory for this app right now.
    let enabled = true;
    if (bundleId) {
      const host = await prisma.app.findFirst({
        where: { workspaceId: workspace.id, bundleId },
        select: { id: true, acceptsPairings: true, acceptsSponsored: true },
      });
      if (!host) {
        enabled = false;
      } else {
        const [pairings, campaigns] = await Promise.all([
          host.acceptsPairings
            ? prisma.pairing.count({
                where: {
                  status: "ACTIVE",
                  OR: [{ appAId: host.id }, { appBId: host.id }],
                },
              })
            : Promise.resolve(0),
          host.acceptsSponsored
            ? prisma.campaign.count({
                where: { status: "ACTIVE", workspaceId: { not: workspace.id } },
              })
            : Promise.resolve(0),
        ]);
        enabled = pairings + campaigns > 0;
      }
    }

    const config: SdkConfig = {
      enabled,
      cacheSeconds: SDK_DEFAULTS.cacheSeconds,
      minIntervalSeconds: SDK_DEFAULTS.minIntervalSeconds,
      defaultPlacement: SDK_DEFAULTS.defaultPlacement,
      accentColor: null,
    };

    return corsJson(config, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  });
}
