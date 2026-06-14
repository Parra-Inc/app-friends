import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/prisma/client";
import { ensurePersonalWorkspace } from "@/lib/auth/provision";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/dashboard");

  // Make sure every user has at least one workspace (covers OAuth users created
  // before the createUser event, and email users).
  await ensurePersonalWorkspace(
    session.user.id,
    session.user.name,
    session.user.email
  ).catch(() => undefined);

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: { workspace: { select: { slug: true, name: true, plan: true } } },
    orderBy: { workspace: { name: "asc" } },
  });

  const workspaces = memberships.map((m) => ({
    slug: m.workspace.slug,
    name: m.workspace.name,
    plan: m.workspace.plan,
  }));

  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/dashboard";
  const currentSlug =
    pathname.match(/^\/dashboard\/([^/]+)/)?.[1] && pathname.match(/^\/dashboard\/([^/]+)/)?.[1] !== "new"
      ? pathname.match(/^\/dashboard\/([^/]+)/)![1]
      : workspaces[0]?.slug ?? "";

  return (
    <div className="flex min-h-screen bg-paper-raised">
      <Sidebar
        workspaces={workspaces}
        currentSlug={currentSlug}
        pathname={pathname}
        userName={session.user.name ?? "You"}
        userEmail={session.user.email ?? ""}
      />
      <main className="flex-1 overflow-x-hidden" role="main">
        {children}
      </main>
    </div>
  );
}
