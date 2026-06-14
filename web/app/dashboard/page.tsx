import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma/client";

export default async function DashboardIndex() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/dashboard");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { workspace: { select: { slug: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) redirect("/dashboard/new");
  redirect(`/dashboard/${membership.workspace.slug}`);
}
