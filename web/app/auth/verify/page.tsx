import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "Check your email" };

export default function VerifyPage() {
  return (
    <div className="brand-gradient flex min-h-screen flex-col items-center justify-center px-5">
      <Logo size={32} />
      <div className="card mt-8 w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-2xl">
          ✉️
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-muted">
          We sent you a sign-in link. Click it to continue — you can close this
          tab.
        </p>
        <p className="mt-4 text-xs text-muted">
          Running locally? The email is waiting in{" "}
          <a href="http://localhost:8055" className="underline" target="_blank" rel="noreferrer">
            MailHog
          </a>
          .
        </p>
      </div>
    </div>
  );
}
