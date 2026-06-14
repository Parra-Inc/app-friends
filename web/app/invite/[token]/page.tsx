import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma/client";
import { acceptInvitation } from "@/lib/members/service";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Accept invite" };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { workspace: { select: { name: true, slug: true } } },
  });

  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-semibold text-ink">
          This invite has expired
        </h1>
        <p className="mt-2 text-sm text-muted">
          Ask whoever invited you to send a new one.
        </p>
        <Button href="/" variant="secondary" className="mt-6">
          Back to home
        </Button>
      </Shell>
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Join {invitation.workspace.name}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in with <strong>{invitation.email}</strong> to accept this invite.
        </p>
        <Button
          href={`/auth/signin?callbackUrl=/invite/${token}`}
          className="mt-6"
        >
          Sign in to accept
        </Button>
      </Shell>
    );
  }

  // Signed in — accept and bounce to the workspace.
  await acceptInvitation(token, session.user.id);
  redirect(`/dashboard/${invitation.workspace.slug}`);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="brand-gradient flex min-h-screen flex-col items-center justify-center px-5">
      <Logo size={32} />
      <div className="card mt-8 w-full max-w-sm p-8 text-center">{children}</div>
    </div>
  );
}
