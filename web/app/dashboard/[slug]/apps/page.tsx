import Link from "next/link";
import { prisma } from "@/prisma/client";
import { getWorkspacePage } from "@/lib/auth/page";
import { planLimits } from "@/lib/billing/plans";
import { SectionHeading, Card, Badge, EmptyState } from "@/components/ui/display";
import { AddApp } from "@/components/dashboard/apps-client";
import { AppIcon } from "@/components/dashboard/AppIcon";

export const metadata = { title: "Apps" };

export default async function AppsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { workspace } = await getWorkspacePage(slug);

  const apps = await prisma.app.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          pairingsAsA: { where: { status: "ACTIVE" } },
          pairingsAsB: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  const limit = planLimits(workspace.plan).maxApps;
  const atLimit = apps.length >= limit;

  return (
    <div className="p-8">
      <SectionHeading
        title="Apps"
        description="The apps you've put on the network."
        action={
          <Badge tone={atLimit ? "accent" : "muted"}>
            {apps.length}
            {limit === Infinity ? "" : ` / ${limit}`} apps
          </Badge>
        }
      />

      {apps.length === 0 ? null : (
        <div className="mb-8 grid gap-3">
          {apps.map((app) => {
            const friends = app._count.pairingsAsA + app._count.pairingsAsB;
            return (
              <Link key={app.id} href={`/dashboard/${slug}/apps/${app.id}`}>
                <Card className="flex items-center gap-4 p-4 transition-colors hover:border-brand/40">
                  <AppIcon src={app.iconUrl} name={app.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-ink">{app.name}</span>
                      {app.status !== "ACTIVE" ? (
                        <Badge tone="muted">{app.status.toLowerCase()}</Badge>
                      ) : null}
                    </div>
                    <div className="truncate font-mono text-xs text-muted">
                      {app.bundleId}
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-sm text-ink">{friends} friends</div>
                    <div className="text-xs text-muted">{app.category ?? "Uncategorized"}</div>
                  </div>
                  <span className="text-muted">›</span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {atLimit && limit !== Infinity ? (
        <Card className="mb-6 flex items-center justify-between p-5">
          <div>
            <div className="font-medium text-ink">You&apos;ve hit the Free app limit</div>
            <div className="text-sm text-muted">Upgrade to Pro for unlimited apps.</div>
          </div>
          <Link href={`/dashboard/${slug}/billing`} className="text-sm font-medium text-brand">
            Upgrade →
          </Link>
        </Card>
      ) : (
        <div className="mb-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Add an app
          </h2>
          <AddApp slug={slug} />
        </div>
      )}

      {apps.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No apps yet"
            description="Register your first app above to start trading installs."
          />
        </div>
      ) : null}
    </div>
  );
}
