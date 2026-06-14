"use server";

import { prisma } from "@/prisma/client";
import { requireWorkspace } from "@/lib/auth/context";
import { discoverApps, type DiscoverableApp } from "@/lib/network/discovery";
import { ok, fail, runAction, type ActionResult } from "./result";

export async function discoverFriends(
  slug: string,
  input: { forAppId: string; query?: string; includeOverlap?: boolean }
): Promise<ActionResult<{ apps: DiscoverableApp[] }>> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug);
    const app = await prisma.app.findFirst({
      where: { id: input.forAppId, workspaceId: workspace.id },
    });
    if (!app) return fail("Pick one of your apps.");
    const apps = await discoverApps({
      forAppId: app.id,
      query: input.query,
      includeOverlap: input.includeOverlap,
    });
    return ok({ apps });
  });
}
