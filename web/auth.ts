import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Apple from "next-auth/providers/apple";
import Nodemailer from "next-auth/providers/nodemailer";
import type { Provider } from "next-auth/providers";
import { prisma } from "@/prisma/client";
import { ensurePersonalWorkspace } from "@/lib/auth/provision";

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

// Email magic link — always available. Locally this delivers to MailHog
// (http://localhost:8055); in prod point the SMTP server at Resend.
providers.push(
  Nodemailer({
    server: {
      host: process.env.MAILHOG_HOST || "localhost",
      port: Number(process.env.MAILHOG_PORT || 1055),
      auth: process.env.RESEND_API_KEY
        ? { user: "resend", pass: process.env.RESEND_API_KEY }
        : undefined,
    },
    from: process.env.EMAIL_FROM || "App Friends <noreply@appfriends.dev>",
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
