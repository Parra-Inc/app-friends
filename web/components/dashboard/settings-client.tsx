"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateWorkspaceSettings } from "@/lib/actions/workspaces";
import {
  inviteMember,
  changeMemberRole,
  removeMember,
  revokeInvitation,
} from "@/lib/actions/members";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Toggle } from "@/components/ui/form";
import { Card } from "@/components/ui/display";
import type { MemberRole } from "@prisma/client";

export function WorkspaceSettingsForm({
  slug,
  name,
  autoApprove,
  canEdit,
}: {
  slug: string;
  name: string;
  autoApprove: boolean;
  canEdit: boolean;
}) {
  const [n, setN] = useState(name);
  const [auto, setAuto] = useState(autoApprove);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  function save() {
    start(async () => {
      await updateWorkspaceSettings(slug, { name: n, autoApproveAdvertisers: auto });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-ink">Workspace</h3>
      <div className="mt-4 space-y-4">
        <Field label="Name">
          <Input value={n} onChange={(e) => { setN(e.target.value); setSaved(false); }} disabled={!canEdit} />
        </Field>
        <Toggle
          label="Auto-approve advertisers"
          description="Let approved-by-default advertisers run in your apps without per-campaign review. You can still block individuals."
          checked={auto}
          onChange={(v) => { setAuto(v); setSaved(false); }}
          disabled={!canEdit}
        />
        {canEdit ? (
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            {saved ? <span className="text-sm text-positive">Saved ✓</span> : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function InviteForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("MEMBER");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function invite() {
    setMsg(null);
    start(async () => {
      const res = await inviteMember(slug, { email, role });
      if (res.ok) {
        setMsg(`Invite sent to ${email}`);
        setEmail("");
        router.refresh();
      } else setMsg(res.error);
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <Field label="Invite by email">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@studio.com"
        />
      </Field>
      <Field label="Role">
        <Select value={role} onChange={(e) => setRole(e.target.value as MemberRole)}>
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </Field>
      <Button onClick={invite} disabled={pending || !email}>
        {pending ? "Sending…" : "Send invite"}
      </Button>
      {msg ? <p className="text-sm text-muted sm:col-span-3">{msg}</p> : null}
    </div>
  );
}

export function MemberRow({
  slug,
  membershipId,
  name,
  email,
  role,
  isYou,
  canManage,
}: {
  slug: string;
  membershipId: string;
  name: string;
  email: string;
  role: MemberRole;
  isYou: boolean;
  canManage: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-ink">
          {name} {isYou ? <span className="text-muted">(you)</span> : null}
        </div>
        <div className="truncate text-xs text-muted">{email}</div>
      </div>
      <div className="flex items-center gap-2">
        {canManage && !isYou ? (
          <select
            value={role}
            onChange={(e) =>
              start(async () => {
                await changeMemberRole(slug, {
                  membershipId,
                  role: e.target.value as MemberRole,
                });
                router.refresh();
              })
            }
            className="rounded-lg border border-rule bg-paper-raised px-2 py-1 text-sm"
            disabled={pending}
          >
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
          </select>
        ) : (
          <span className="text-sm text-muted">{role.toLowerCase()}</span>
        )}
        {canManage && !isYou ? (
          <button
            onClick={() =>
              start(async () => {
                await removeMember(slug, { membershipId });
                router.refresh();
              })
            }
            className="text-sm text-error hover:underline"
            disabled={pending}
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function InvitationRow({
  slug,
  invitationId,
  email,
  role,
}: {
  slug: string;
  invitationId: string;
  email: string;
  role: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="text-sm">
        <span className="text-ink">{email}</span>{" "}
        <span className="text-muted">· {role.toLowerCase()} · pending</span>
      </div>
      <button
        onClick={() =>
          start(async () => {
            await revokeInvitation(slug, { invitationId });
            router.refresh();
          })
        }
        className="text-sm text-error hover:underline"
        disabled={pending}
      >
        Revoke
      </button>
    </div>
  );
}
