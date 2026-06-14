import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/prisma/client";
import { getWorkspacePage } from "@/lib/auth/page";
import { appTotals } from "@/lib/network/analytics";
import { AppIcon } from "@/components/dashboard/AppIcon";
import { Badge, Stat } from "@/components/ui/display";
import { AppSettingsForm, DeleteAppButton } from "@/components/dashboard/apps-client";
import { formatCount } from "@/lib/format";

export const metadata = { title: "App" };

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string; appId: string }>;
}) {
  const { slug, appId } = await params;
  const { workspace } = await getWorkspacePage(slug);

  const app = await prisma.app.findFirst({
    where: { id: appId, workspaceId: workspace.id },
  });
  if (!app) notFound();

  const totals = await appTotals(app.id, 30);

  return (
    <div className="p-8">
      <Link
        href={`/dashboard/${slug}/apps`}
        className="text-sm text-muted hover:text-ink"
      >
        ← Apps
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <AppIcon src={app.iconUrl} name={app.name} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-ink">{app.name}</h1>
            <Badge tone={app.status === "ACTIVE" ? "positive" : "muted"}>
              {app.status.toLowerCase()}
            </Badge>
            <Badge tone="muted">{app.platform === "IOS" ? "iOS" : "Android"}</Badge>
          </div>
          <div className="mt-1 font-mono text-sm text-muted">{app.bundleId}</div>
          {app.storeUrl ? (
            <a
              href={app.storeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm text-brand hover:underline"
            >
              View on the App Store ↗
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Views received (30d)" value={formatCount(totals.impressionsReceived)} />
        <Stat label="Taps" value={formatCount(totals.taps)} />
        <Stat label="Installs" value={formatCount(totals.installs)} tone="positive" />
        <Stat label="Views given" value={formatCount(totals.impressionsGiven)} tone="brand" />
      </div>

      {app.promoScreenshots.length > 0 ? (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Screenshots
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {app.promoScreenshots.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="h-44 rounded-xl border border-rule object-cover"
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <AppSettingsForm
          slug={slug}
          app={{
            id: app.id,
            name: app.name,
            subtitle: app.subtitle,
            category: app.category,
            storeUrl: app.storeUrl,
            iconUrl: app.iconUrl,
            promoHeadline: app.promoHeadline,
            promoSubtitle: app.promoSubtitle,
            acceptsPairings: app.acceptsPairings,
            acceptsSponsored: app.acceptsSponsored,
            status: app.status,
          }}
        />
      </div>

      <div className="mt-8 border-t border-rule pt-6">
        <DeleteAppButton slug={slug} appId={app.id} />
      </div>
    </div>
  );
}
