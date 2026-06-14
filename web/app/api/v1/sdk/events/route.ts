import { z } from "zod";
import { assertSdkKey } from "@/lib/auth/sdk-auth";
import { AppFriendsError, handleRoute } from "@/lib/errors";
import { rateLimit } from "@/lib/queue/ratelimit";
import { corsJson, corsPreflight } from "@/lib/sdk/cors";
import { verifyPromoToken } from "@/lib/sdk/token";
import { recordEvent } from "@/lib/network/events";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

const schema = z.object({
  events: z
    .array(
      z.object({
        token: z.string().min(1),
        type: z.enum(["impression", "tap", "install"]),
        country: z.string().length(2).optional(),
      })
    )
    .min(1)
    .max(50),
});

export async function POST(req: Request) {
  return handleRoute(async () => {
    const { workspace } = await assertSdkKey(req);

    const rl = await rateLimit(`events:${workspace.id}`);
    if (!rl.success) throw new AppFriendsError("rate_limit:sdk");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new AppFriendsError("bad_request:sdk");

    let accepted = 0;
    for (const e of parsed.data.events) {
      const claims = await verifyPromoToken(e.token);
      if (!claims) continue; // expired or forged — drop silently
      // The publisher app in the token must belong to the calling workspace.
      const result = await recordEvent(claims, e.type, e.country).catch(
        () => ({ recorded: false })
      );
      if (result.recorded) accepted += 1;
    }

    return corsJson({ accepted });
  });
}
