"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/prisma/client";
import { requireWorkspace } from "@/lib/auth/context";
import { generateApiKey } from "@/lib/keys";
import { ok, fail, runAction, type ActionResult } from "./result";
import type { ApiKeyScope } from "@prisma/client";

export async function createApiKey(
  slug: string,
  input: { scope: ApiKeyScope; label?: string }
): Promise<ActionResult<{ raw: string; id: string }>> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN"]);
    const { raw, hash, prefix } = generateApiKey(input.scope);
    const key = await prisma.apiKey.create({
      data: {
        workspaceId: workspace.id,
        scope: input.scope,
        hash,
        prefix,
        label: input.label?.trim() || null,
      },
    });
    revalidatePath(`/dashboard/${slug}/keys`);
    // The raw key is returned exactly once; we store only the hash.
    return ok({ raw, id: key.id });
  });
}

export async function revokeApiKey(
  slug: string,
  keyId: string
): Promise<ActionResult> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN"]);
    const key = await prisma.apiKey.findFirst({
      where: { id: keyId, workspaceId: workspace.id, revokedAt: null },
    });
    if (!key) return fail("Key not found.");
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { revokedAt: new Date() },
    });
    revalidatePath(`/dashboard/${slug}/keys`);
    return ok();
  });
}
