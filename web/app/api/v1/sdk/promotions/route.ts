import { assertSdkKey } from "@/lib/auth/sdk-auth";
import { prisma } from "@/prisma/client";
import { AppFriendsError, handleRoute } from "@/lib/errors";
import { rateLimit } from "@/lib/queue/ratelimit";
import { corsJson, corsPreflight } from "@/lib/sdk/cors";
import { buildPromotions } from "@/lib/network/promotions";
import { SDK_DEFAULTS, type Placement } from "@/lib/sdk/contract";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request) {
  return handleRoute(async () => {
    const { workspace } = await assertSdkKey(req);

    const url = new URL(req.url);
    const bundleId = url.searchParams.get("bundleId")?.trim();
    if (!bundleId) throw new AppFriendsError("bad_request:sdk", "bundleId is required");

    const rl = await rateLimit(`promos:${workspace.id}:${bundleId}`);
    if (!rl.success) throw new AppFriendsError("rate_limit:sdk");

    const placement = parsePlacement(url.searchParams.get("placement"));
    const limit = Number(url.searchParams.get("limit")) || SDK_DEFAULTS.maxPromos;
    const country = url.searchParams.get("country");
    const platform = url.searchParams.get("platform")?.toUpperCase();

    const hostApp = await prisma.app.findFirst({
      where: {
        workspaceId: workspace.id,
        bundleId,
        ...(platform === "ANDROID" || platform === "IOS"
          ? { platform }
          : {}),
      },
    });
    if (!hostApp) throw new AppFriendsError("not_found:sdk");

    const response = await buildPromotions({
      hostApp,
      placement,
      limit,
      country,
    });

    return corsJson(response, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  });
}

function parsePlacement(value: string | null): Placement {
  const v = (value || "").toUpperCase();
  if (v === "FULLSCREEN" || v === "BANNER" || v === "POPUP") return v;
  return SDK_DEFAULTS.defaultPlacement;
}
