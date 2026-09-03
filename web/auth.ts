import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Apple from "next-auth/providers/apple";
import Nodemailer from "next-auth/providers/nodemailer";
import type { Provider } from "next-auth/providers";
import { prisma } from "@/prisma/client";
import { ensurePersonalWorkspace } from "@/lib/auth/provision";
import { sendEmail } from "@/lib/email/email-service";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const providers: Provider[] = [];

if (process.env.GOOGLE_CLIENT_ID) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

if (process.env.GITHUB_CLIENT_ID) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          githubId: String(profile.id),
          githubLogin: profile.login,
        };
      },
    })
  );
}

if (process.env.AUTH_APPLE_ID) {
  providers.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET!,
    })
  );
}

// Email magic link — always available. Delivery routes through the canonical
// email service: MailHog locally, Cloudflare Email Sending in prod.
providers.push(
  Nodemailer({
    // `server` is unused because we override `sendVerificationRequest`, but the
    // provider still requires it to be present.
    server: {},
    from: process.env.EMAIL_FROM || "App Friends <noreply@appfriends.dev>",
    async sendVerificationRequest({ identifier, url }) {
      const { host } = new URL(url);
      await sendEmail({
        to: identifier,
        subject: `Sign in to ${host}`,
        html: `<body style="font-family:system-ui,-apple-system,sans-serif;padding:24px">
  <h2 style="margin:0 0 16px">Sign in to App Friends</h2>
  <p style="margin:0 0 24px">Click the button below to sign in. This link expires shortly.</p>
  <p style="margin:0 0 24px">
    <a href="${url}" style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Sign in</a>
  </p>
  <p style="margin:0;color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
</body>`,
        text: `Sign in to App Friends\n\n${url}\n\nIf you didn't request this, you can safely ignore this email.`,
      });
    },
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await ensurePersonalWorkspace(user.id, user.name, user.email).catch(
          () => undefined
        );
      }
    },
  },
});
