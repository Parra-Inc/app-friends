import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="brand-gradient flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <Logo size={32} />
      <h1 className="mt-8 font-display text-5xl font-semibold text-ink">404</h1>
      <p className="mt-2 max-w-sm text-muted">
        That page wandered off to find new friends. Let&apos;s get you back.
      </p>
      <Button href="/" className="mt-6">
        Back to home
      </Button>
    </div>
  );
}
