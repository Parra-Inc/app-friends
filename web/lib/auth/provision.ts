import { prisma } from "@/prisma/client";
import { slugify } from "@/lib/format";

/**
 * Every user gets a personal workspace on first sign-in. Idempotent — safe to
 * call from the NextAuth createUser event or lazily from the dashboard.
 */
export async function ensurePersonalWorkspace(
  userId: string,
  name?: string | null,
  email?: string | null
) {
  const existing = await prisma.membership.findFirst({ where: { userId } });
  if (existing) return existing.workspaceId;

  const base =
    slugify(name || "") ||
    slugify((email || "").split("@")[0] || "") ||
    "workspace";

  const slug = await uniqueSlug(base);
  const displayName = name?.trim() || email?.split("@")[0] || "My workspace";

  const workspace = await prisma.workspace.create({
    data: {
      name: displayName,
      slug,
      memberships: { create: { userId, role: "OWNER" } },
    },
  });
  return workspace.id;
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base || "workspace";
  let n = 1;
  // Bounded loop — collisions are rare.
  while (await prisma.workspace.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 50) {
      candidate = `${base}-${Math.random().toString(36).slice(2, 8)}`;
      break;
    }
  }
  return candidate;
}
