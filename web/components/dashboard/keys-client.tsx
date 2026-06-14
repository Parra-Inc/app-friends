"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createApiKey, revokeApiKey } from "@/lib/actions/keys";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { Card } from "@/components/ui/display";
import type { ApiKeyScope } from "@prisma/client";

export function CreateKey({ slug }: { slug: string }) {
  const [scope, setScope] = useState<ApiKeyScope>("PUBLISHABLE");
  const [label, setLabel] = useState("");
  const [raw, setRaw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function create() {
    setError(null);
    start(async () => {
      const res = await createApiKey(slug, { scope, label });
      if (res.ok && res.data) {
        setRaw(res.data.raw);
        setLabel("");
        router.refresh();
      } else if (!res.ok) setError(res.error);
    });
  }

  if (raw) {
    return (
      <Card className="border-brand/40 p-6">
        <h3 className="font-semibold text-ink">Copy your key now</h3>
        <p className="mt-1 text-sm text-muted">
          This is the only time we&apos;ll show it. We store only a hash.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rule bg-paper p-3">
          <code className="flex-1 break-all font-mono text-sm text-ink">{raw}</code>
          <Button
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(raw);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="mt-4" onClick={() => setRaw(null)}>
          Done
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-ink">Create a key</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Type">
          <Select value={scope} onChange={(e) => setScope(e.target.value as ApiKeyScope)}>
            <option value="PUBLISHABLE">Publishable (afp_) — for the SDK</option>
            <option value="SECRET">Secret (afs_) — server-to-server</option>
          </Select>
        </Field>
        <Field label="Label">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="iOS production" />
        </Field>
        <Button onClick={create} disabled={pending}>
          {pending ? "Creating…" : "Create key"}
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
    </Card>
  );
}

export function RevokeKeyButton({ slug, keyId }: { slug: string; keyId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-error"
      onClick={() =>
        start(async () => {
          await revokeApiKey(slug, keyId);
          router.refresh();
        })
      }
    >
      {pending ? "Revoking…" : "Revoke"}
    </Button>
  );
}
