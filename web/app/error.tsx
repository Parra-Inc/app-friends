"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-muted">
        We hit an unexpected error. Try again, and if it keeps happening let us
        know.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="secondary">
          Home
        </Button>
      </div>
    </div>
  );
}
