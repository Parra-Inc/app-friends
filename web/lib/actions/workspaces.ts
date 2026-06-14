"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/prisma/client";
import { assertApiUser } from "@/lib/auth/api-auth";
import { requireWorkspace } from "@/lib/auth/context";
import { slugify } from "@/lib/format";
import { ok, fail, runAction, type ActionResult } from "./result";

export async function createWorkspace(
  name: string
): Promise<ActionResult<{ slug: string }>> {
  return runAction(async () => {
    const { user } = await assertApiUser();
    const trimmed = name.trim();
    if (!trimmed) return fail("Give your workspace a name.");

    let slug = slugify(trimmed) || "workspace";
    let n = 1;
    while (await prisma.workspace.findUnique({ where: { slug } })) {
      n += 1;
      slug = `${slugify(trimmed)}-${n}`;
      if (n > 50) return fail("Couldn't find an available slug.");
    }

    await prisma.workspace.create({
      data: {
        name: trimmed,
        slug,
        memberships: { create: { userId: user.id, role: "OWNER" } },
      },
    });
    revalidatePath("/dashboard");
    return ok({ slug });
  });
}

export async function updateWorkspaceSettings(
  slug: string,
  input: { name?: string; autoApproveAdvertisers?: boolean }
): Promise<ActionResult> {
  return runAction(async () => {
    const { workspace } = await requireWorkspace(slug, ["OWNER", "ADMIN"]);
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.autoApproveAdvertisers !== undefined
          ? { autoApproveAdvertisers: input.autoApproveAdvertisers }
          : {}),
      },
    });
    revalidatePath(`/dashboard/${slug}/settings`);
    return ok();
  });
}
