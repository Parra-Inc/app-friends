import { prisma } from "@/prisma/client";
import { getWorkspacePage } from "@/lib/auth/page";
import { hasRole } from "@/lib/auth/workspace";
import { SectionHeading, Card } from "@/components/ui/display";
import {
  WorkspaceSettingsForm,
  InviteForm,
  MemberRow,
  InvitationRow,
} from "@/components/dashboard/settings-client";

export const metadata = { title: "Settings" };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { workspace, membership, userId } = await getWorkspacePage(slug);
  const canManage = hasRole(membership.role, ["OWNER", "ADMIN"]);

  const [members, invitations] = await Promise.all([
    prisma.membership.findMany({
      where: { workspaceId: workspace.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { workspaceId: workspace.id, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="p-8">
      <SectionHeading title="Settings" description="Workspace and team." />

      <div className="space-y-6">
        <WorkspaceSettingsForm
          slug={slug}
          name={workspace.name}
          autoApprove={workspace.autoApproveAdvertisers}
          canEdit={canManage}
        />

        <Card className="overflow-hidden">
          <div className="border-b border-rule px-5 py-4">
            <h3 className="font-semibold text-ink">Team</h3>
            <p className="text-sm text-muted">People with access to this workspace.</p>
          </div>
          <div className="divide-y divide-rule">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                slug={slug}
                membershipId={m.id}
                name={m.user.name ?? m.user.email}
                email={m.user.email}
                role={m.role}
                isYou={m.userId === userId}
                canManage={membership.role === "OWNER"}
              />
            ))}
            {invitations.map((inv) => (
              <InvitationRow
                key={inv.id}
                slug={slug}
                invitationId={inv.id}
                email={inv.email}
                role={inv.role}
              />
            ))}
          </div>
          {canManage ? (
            <div className="border-t border-rule px-5 py-4">
              <InviteForm slug={slug} />
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
