import { prisma } from "@/prisma/client";
import { getWorkspacePage } from "@/lib/auth/page";
import { SectionHeading, Card, Badge, EmptyState } from "@/components/ui/display";
import { CreateKey, RevokeKeyButton } from "@/components/dashboard/keys-client";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "API keys" };

export default async function KeysPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { workspace } = await getWorkspacePage(slug);

  const keys = await prisma.apiKey.findMany({
    where: { workspaceId: workspace.id },
    orderBy: [{ revokedAt: "asc" }, { createdAt: "desc" }],
  });

  const live = keys.filter((k) => !k.revokedAt);
  const revoked = keys.filter((k) => k.revokedAt);

  return (
    <div className="p-8">
      <SectionHeading
        title="API keys"
        description="Publishable keys go in your app's SDK. Secret keys are for server-to-server calls."
      />

      <div className="mb-8">
        <CreateKey slug={slug} />
      </div>

      {live.length === 0 ? (
        <EmptyState title="No keys yet" description="Create a publishable key to wire up the SDK." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-muted">
                <th className="px-5 py-3 font-medium">Key</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Last used</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {live.map((k) => (
                <tr key={k.id}>
                  <td className="px-5 py-3">
                    <span className="font-mono text-ink">{k.prefix}…</span>
                    {k.label ? (
                      <span className="ml-2 text-muted">{k.label}</span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={k.scope === "SECRET" ? "accent" : "brand"}>
                      {k.scope === "SECRET" ? "Secret" : "Publishable"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {k.lastUsedAt ? timeAgo(k.lastUsedAt) : "never"}
                  </td>
                  <td className="px-5 py-3 text-muted">{timeAgo(k.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <RevokeKeyButton slug={slug} keyId={k.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {revoked.length > 0 ? (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Revoked
          </h3>
          <div className="space-y-1 text-sm text-muted">
            {revoked.map((k) => (
              <div key={k.id} className="font-mono">
                {k.prefix}… · revoked {timeAgo(k.revokedAt!)}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
