"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/lib/actions/workspaces";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/form";

export function CreateWorkspaceForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit() {
    setError(null);
    start(async () => {
      const res = await createWorkspace(name);
      if (res.ok && res.data) router.push(`/dashboard/${res.data.slug}`);
      else if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <Field label="Workspace name" error={error ?? undefined}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Studio"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
      </Field>
      <Button onClick={submit} disabled={pending || !name.trim()} className="w-full">
        {pending ? "Creating…" : "Create workspace"}
      </Button>
    </div>
  );
}
