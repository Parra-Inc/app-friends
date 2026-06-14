import { prisma } from "@/prisma/client";
import { getWorkspacePage } from "@/lib/auth/page";
import {
  workspaceTotals,
  workspaceSeries,
  appTotals,
} from "@/lib/network/analytics";
import { SectionHeading, Stat, Card, EmptyState } from "@/components/ui/display";
import { ActivityChart } from "@/components/dashboard/Chart";
import { AppIcon } from "@/components/dashboard/AppIcon";
import { formatCount, formatUsd, formatPct } from "@/lib/format";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { workspace } = await getWorkspacePage(slug);

  const [totals, series, apps] = await Promise.all([
    workspaceTotals(workspace.id, 30),
    workspaceSeries(workspace.id, 30),
    prisma.app.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true, iconUrl: true },
    }),
  ]);

  const perApp = await Promise.all(
    apps.map(async (a) => ({ app: a, totals: await appTotals(a.id, 30) }))
  );

  const hasData = totals.impressionsGiven + totals.impressionsReceived > 0;

  return (
    <div className="p-8">
      <SectionHeading title="Analytics" description="The last 30 days." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Views received" value={formatCount(totals.impressionsReceived)} tone="brand" />
        <Stat label="Views given" value={formatCount(totals.impressionsGiven)} tone="accent" />
        <Stat label="Installs" value={formatCount(totals.installs)} sub={`${formatPct(totals.installs, totals.taps)} of taps`} tone="positive" />
        <Stat label="Earned" value={formatUsd(totals.earnedCents)} sub={`${formatUsd(totals.spendCents)} spent`} />
      </div>

      <Card className="mt-6 p-6">
        <h3 className="mb-4 font-semibold text-ink">Activity</h3>
        {hasData ? (
          <ActivityChart data={series} />
        ) : (
          <p className="py-12 text-center text-sm text-muted">
            No activity yet. Once your apps start showing and being shown, it&apos;ll
            chart here.
          </p>
        )}
      </Card>

      <h3 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted">
        By app
      </h3>
      {perApp.length === 0 ? (
        <EmptyState title="No apps" description="Add an app to see per-app numbers." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-muted">
                <th className="px-5 py-3 font-medium">App</th>
                <th className="px-5 py-3 text-right font-medium">Received</th>
                <th className="px-5 py-3 text-right font-medium">Given</th>
                <th className="px-5 py-3 text-right font-medium">Installs</th>
                <th className="px-5 py-3 text-right font-medium">Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {perApp.map(({ app, totals: t }) => (
                <tr key={app.id}>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2.5">
                      <AppIcon src={app.iconUrl} name={app.name} size={28} />
                      <span className="text-ink">{app.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular text-ink-soft">{formatCount(t.impressionsReceived)}</td>
                  <td className="px-5 py-3 text-right tabular text-ink-soft">{formatCount(t.impressionsGiven)}</td>
                  <td className="px-5 py-3 text-right tabular text-ink-soft">{formatCount(t.installs)}</td>
                  <td className="px-5 py-3 text-right tabular text-ink-soft">{formatUsd(t.earnedCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
