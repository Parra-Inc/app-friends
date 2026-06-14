"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCampaign, setCampaignStatus } from "@/lib/actions/campaigns";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { Card } from "@/components/ui/display";
import { APP_CATEGORIES } from "@/lib/categories";
import type { CampaignStatus, PricingModel, Platform } from "@prisma/client";

export function CreateCampaign({
  slug,
  apps,
}: {
  slug: string;
  apps: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [appId, setAppId] = useState(apps[0]?.id ?? "");
  const [name, setName] = useState("");
  const [pricingModel, setPricingModel] = useState<PricingModel>("CPI");
  const [bid, setBid] = useState("1.50");
  const [budget, setBudget] = useState("100");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function togglePlatform(p: Platform) {
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }

  function create() {
    setError(null);
    start(async () => {
      const res = await createCampaign(slug, {
        name,
        appId,
        pricingModel,
        bidCents: Math.round(parseFloat(bid || "0") * 100),
        totalBudgetCents: Math.round(parseFloat(budget || "0") * 100),
        targetPlatforms: platforms,
        targetCategories: categories,
      });
      if (res.ok && res.data) router.push(`/dashboard/${slug}/campaigns/${res.data.campaignId}`);
      else if (!res.ok) setError(res.error);
    });
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>New campaign</Button>;
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-ink">New sponsored campaign</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="App to advertise" required>
          <Select value={appId} onChange={(e) => setAppId(e.target.value)}>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Campaign name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Spring launch" />
        </Field>
        <Field label="Pricing">
          <Select value={pricingModel} onChange={(e) => setPricingModel(e.target.value as PricingModel)}>
            <option value="CPI">CPI — cost per install</option>
            <option value="CPM">CPM — cost per 1,000 views</option>
          </Select>
        </Field>
        <Field label={pricingModel === "CPI" ? "Bid per install ($)" : "Bid per 1,000 views ($)"}>
          <Input type="number" step="0.01" min="0" value={bid} onChange={(e) => setBid(e.target.value)} />
        </Field>
        <Field label="Total budget ($)">
          <Input type="number" step="1" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </Field>
        <Field label="Target platforms" hint="Leave empty for all.">
          <div className="flex gap-3 pt-2">
            {(["IOS", "ANDROID"] as Platform[]).map((p) => (
              <label key={p} className="flex items-center gap-1.5 text-sm text-ink-soft">
                <input type="checkbox" checked={platforms.includes(p)} onChange={() => togglePlatform(p)} />
                {p === "IOS" ? "iOS" : "Android"}
              </label>
            ))}
          </div>
        </Field>
      </div>
      <Field label="Target categories" hint="Cmd/Ctrl-click for multiple. Leave empty for all.">
        <select
          multiple
          value={categories}
          onChange={(e) =>
            setCategories(Array.from(e.target.selectedOptions).map((o) => o.value))
          }
          className="h-28 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm"
        >
          {APP_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
      <div className="mt-4 flex gap-2">
        <Button onClick={create} disabled={pending || !appId}>
          {pending ? "Creating…" : "Create as draft"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </Card>
  );
}

export function CampaignStatusButton({
  slug,
  campaignId,
  status,
}: {
  slug: string;
  campaignId: string;
  status: CampaignStatus;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function setStatus(next: CampaignStatus) {
    setError(null);
    start(async () => {
      const res = await setCampaignStatus(slug, { campaignId, status: next });
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  const canActivate = status === "DRAFT" || status === "PAUSED";
  return (
    <div className="flex items-center gap-2">
      {canActivate ? (
        <Button size="sm" onClick={() => setStatus("ACTIVE")} disabled={pending}>
          {pending ? "…" : "Activate"}
        </Button>
      ) : status === "ACTIVE" ? (
        <Button variant="secondary" size="sm" onClick={() => setStatus("PAUSED")} disabled={pending}>
          Pause
        </Button>
      ) : null}
      {status !== "ENDED" ? (
        <Button variant="ghost" size="sm" className="text-error" onClick={() => setStatus("ENDED")} disabled={pending}>
          End
        </Button>
      ) : null}
      {error ? <span className="text-sm text-error">{error}</span> : null}
    </div>
  );
}
