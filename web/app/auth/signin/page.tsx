import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/form";
import { emailSignIn, providerSignIn } from "@/lib/actions/auth-signin";

export const metadata: Metadata = { title: "Sign in" };

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default async function SignInPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  const hasGoogle = !!process.env.GOOGLE_CLIENT_ID;
  const hasGitHub = !!process.env.GITHUB_CLIENT_ID;
  const hasApple = !!process.env.AUTH_APPLE_ID;
  const hasOAuth = hasGoogle || hasGitHub || hasApple;

  return (
    <div className="brand-gradient flex min-h-screen flex-col items-center justify-center px-5 py-16">
      <Logo size={32} />
      <div className="card mt-8 w-full max-w-sm p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Welcome</h1>
        <p className="mt-1 text-sm text-muted">
          Sign in to your App Friends workspace.
        </p>

        {hasOAuth ? (
          <div className="mt-6 space-y-2">
            {hasGoogle ? (
              <form action={providerSignIn.bind(null, "google")}>
                <Button type="submit" variant="secondary" className="w-full">
                  <GoogleMark /> Continue with Google
                </Button>
              </form>
            ) : null}
            {hasGitHub ? (
              <form action={providerSignIn.bind(null, "github")}>
                <Button type="submit" variant="secondary" className="w-full">
                  Continue with GitHub
                </Button>
              </form>
            ) : null}
            {hasApple ? (
              <form action={providerSignIn.bind(null, "apple")}>
                <Button type="submit" variant="secondary" className="w-full">
                  Continue with Apple
                </Button>
              </form>
            ) : null}
          </div>
        ) : null}

        {hasOAuth ? (
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-rule" />
            or
            <span className="h-px flex-1 bg-rule" />
          </div>
        ) : (
          <div className="mt-6" />
        )}

        <form action={emailSignIn} className="space-y-3">
          <Input
            type="email"
            name="email"
            required
            placeholder="you@studio.com"
            autoComplete="email"
          />
          <Button type="submit" className="w-full">
            Email me a sign-in link
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted">
          By continuing you agree to our{" "}
          <a href="/terms" className="underline">Terms</a> and{" "}
          <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
      </div>
      <Link href="/" className="mt-6 text-sm text-muted hover:text-ink">
        ← Back to home
      </Link>
    </div>
  );
}
