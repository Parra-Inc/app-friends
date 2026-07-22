import { randomBytes } from "node:crypto";
import { prisma } from "@/prisma/client";
import { AppFriendsError } from "@/lib/errors";
import { sendEmail } from "@/lib/email/email-service";
import { invitationEmail } from "@/lib/email/templates";
import type { MemberRole } from "@prisma/client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3053";

export async function inviteMember(args: {
  workspaceId: string;
  email: string;
  role: MemberRole;
  invitedById: string;
  inviterName: string;
  workspaceName: string;
}) {
  const email = args.email.toLowerCase().trim();

  // Already a member?
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: existingUser.id,
          workspaceId: args.workspaceId,
        },
      },
    });
    if (membership) throw new AppFriendsError("conflict:member");
  }

  const token = randomBytes(24).toString("base64url");
  const invitation = await prisma.invitation.upsert({
    where: { workspaceId_email: { workspaceId: args.workspaceId, email } },
    update: {
      role: args.role,
      token,
      invitedById: args.invitedById,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      acceptedAt: null,
    },
    create: {
      workspaceId: args.workspaceId,
      email,
      role: args.role,
      token,
      invitedById: args.invitedById,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const { subject, html } = invitationEmail({
    workspaceName: args.workspaceName,
    inviterName: args.inviterName,
    acceptUrl: `${SITE}/invite/${token}`,
  });
  await sendEmail({ to: email, subject, html });

  return invitation;
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation || invitation.acceptedAt) {
    throw new AppFriendsError("not_found:member");
  }
  if (invitation.expiresAt < new Date()) {
    throw new AppFriendsError("bad_request:member");
  }

  await prisma.$transaction([
    prisma.membership.upsert({
      where: {
        userId_workspaceId: { userId, workspaceId: invitation.workspaceId },
      },
      update: { role: invitation.role },
      create: {
        userId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return invitation.workspaceId;
}
