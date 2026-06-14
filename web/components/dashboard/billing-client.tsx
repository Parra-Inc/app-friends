"use client";

import { useState, useTransition } from "react";
import { startProCheckout, startWalletTopup, openBillingPortal } from "@/lib/actions/billing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/form";
import { WALLET_TOPUP_PRESETS_CENTS } from "@/lib/billing/plans";
import { formatUsd } from "@/lib/format";

function useRedirectAction() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  function run(fn: () => Promise<{ ok: boolean; data?: { url: string }; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.ok && res.data?.url) window.location.href = res.data.url;
      else setError(res.error ?? "Something went wrong.");
    });
  }
  return { error, pending, run };
}

export function UpgradeButton({ slug }: { slug: string }) {
  const { error, pending, run } = useRedirectAction();
  return (
    <div>
      <Button onClick={() => run(() => startProCheckout(slug))} disabled={pending}>
        {pending ? "Redirecting…" : "Upgrade to Pro"}
      </Button>
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}

export function ManageBillingButton({ slug }: { slug: string }) {
  const { error, pending, run } = useRedirectAction();
  return (
    <div>
      <Button variant="secondary" onClick={() => run(() => openBillingPortal(slug))} disabled={pending}>
        {pending ? "Opening…" : "Manage billing"}
      </Button>
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}

export function TopupControls({ slug }: { slug: string }) {
  const { error, pending, run } = useRedirectAction();
  const [custom, setCustom] = useState("");

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {WALLET_TOPUP_PRESETS_CENTS.map((cents) => (
          <Button
            key={cents}
            variant="secondary"
            size="sm"
            onClick={() => run(() => startWalletTopup(slug, { amountCents: cents }))}
            disabled={pending}
          >
            {formatUsd(cents)}
          </Button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Input
          type="number"
          min="10"
          step="1"
          placeholder="Custom $"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="max-w-[140px]"
        />
        <Button
          size="sm"
          onClick={() =>
            run(() =>
              startWalletTopup(slug, {
                amountCents: Math.round(parseFloat(custom || "0") * 100),
              })
            )
          }
          disabled={pending || !custom}
        >
          Add credit
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}
