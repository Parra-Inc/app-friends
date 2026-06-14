"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importApp, createAppManual, updateApp, deleteApp } from "@/lib/actions/apps";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Toggle } from "@/components/ui/form";
import { Card } from "@/components/ui/display";
import { APP_CATEGORIES } from "@/lib/categories";
import type { Platform } from "@prisma/client";

export function AddApp({ slug }: { slug: string }) {
  const [mode, setMode] = useState<"import" | "manual">("import");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  // import
  const [lookup, setLookup] = useState("");
  // manual
  const [name, setName] = useState("");
  const [bundleId, setBundleId] = useState("");
  const [platform, setPlatform] = useState<Platform>("IOS");
  const [category, setCategory] = useState("");
  const [storeUrl, setStoreUrl] = useState("");

  function run() {
    setError(null);
    start(async () => {
      const res =
        mode === "import"
          ? await importApp(slug, { lookup, platform })
          : await createAppManual(slug, {
              name,
              bundleId,
              platform,
              category: category || undefined,
              storeUrl: storeUrl || undefined,
            });
      if (res.ok && res.data) router.push(`/dashboard/${slug}/apps/${res.data.appId}`);
      else if (!res.ok) setError(res.error);
    });
  }

  return (
    <Card className="p-6">
      <div className="mb-4 inline-flex rounded-xl border border-rule p-1 text-sm">
        <button
          onClick={() => setMode("import")}
          className={`rounded-lg px-3 py-1.5 ${mode === "import" ? "bg-brand-soft text-brand" : "text-muted"}`}
        >
          Import from App Store
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`rounded-lg px-3 py-1.5 ${mode === "manual" ? "bg-brand-soft text-brand" : "text-muted"}`}
        >
          Add manually
        </button>
      </div>

      {mode === "import" ? (
        <div className="space-y-3">
          <Field
            label="Bundle id or App Store id"
            hint="e.g. com.acme.app or 1234567890 — we pull the rest automatically."
            error={error ?? undefined}
          >
            <Input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="com.acme.app"
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
          </Field>
          <Button onClick={run} disabled={pending || !lookup.trim()}>
            {pending ? "Looking up…" : "Import app"}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="App name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme" />
          </Field>
          <Field label="Bundle id" required>
            <Input value={bundleId} onChange={(e) => setBundleId(e.target.value)} placeholder="com.acme.app" />
          </Field>
          <Field label="Platform">
            <Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
              <option value="IOS">iOS</option>
              <option value="ANDROID">Android</option>
            </Select>
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Choose…</option>
              {APP_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Store URL">
            <Input value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} placeholder="https://apps.apple.com/…" />
          </Field>
          <div className="flex items-end">
            <Button onClick={run} disabled={pending || !name.trim() || !bundleId.trim()} className="w-full">
              {pending ? "Adding…" : "Add app"}
            </Button>
          </div>
          {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
        </div>
      )}
    </Card>
  );
}

interface AppData {
  id: string;
  name: string;
  subtitle: string | null;
  category: string | null;
  storeUrl: string | null;
  iconUrl: string | null;
  promoHeadline: string | null;
  promoSubtitle: string | null;
  acceptsPairings: boolean;
  acceptsSponsored: boolean;
  status: string;
}

export function AppSettingsForm({ slug, app }: { slug: string; app: AppData }) {
  const [form, setForm] = useState(app);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function set<K extends keyof AppData>(key: K, value: AppData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await updateApp(slug, app.id, {
        name: form.name,
        subtitle: form.subtitle ?? "",
        category: form.category ?? "",
        storeUrl: form.storeUrl ?? "",
        iconUrl: form.iconUrl ?? "",
        promoHeadline: form.promoHeadline ?? "",
        promoSubtitle: form.promoSubtitle ?? "",
        acceptsPairings: form.acceptsPairings,
        acceptsSponsored: form.acceptsSponsored,
        status: form.status as "ACTIVE" | "PAUSED",
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-ink">Details</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Subtitle">
            <Input value={form.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <Field label="Category" hint="Used to keep friends non-competing.">
            <Select value={form.category ?? ""} onChange={(e) => set("category", e.target.value)}>
              <option value="">Choose…</option>
              {APP_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Store URL">
            <Input value={form.storeUrl ?? ""} onChange={(e) => set("storeUrl", e.target.value)} />
          </Field>
          <Field label="Icon URL">
            <Input value={form.iconUrl ?? ""} onChange={(e) => set("iconUrl", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-ink">Promo creative</h3>
        <p className="mt-1 text-sm text-muted">
          What other apps show when they promote yours.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Headline" hint="A punchy one-liner, shown above the subtitle.">
            <Input value={form.promoHeadline ?? ""} onChange={(e) => set("promoHeadline", e.target.value)} />
          </Field>
          <Field label="Promo subtitle">
            <Input value={form.promoSubtitle ?? ""} onChange={(e) => set("promoSubtitle", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-ink">Participation</h3>
        <div className="mt-4 space-y-4">
          <Toggle
            label="Accept view-for-view pairings"
            description="Show friends' promos and let yours be shown in return."
            checked={form.acceptsPairings}
            onChange={(v) => set("acceptsPairings", v)}
          />
          <Toggle
            label="Accept sponsored placements"
            description="Show approved advertisers in this app and earn from them."
            checked={form.acceptsSponsored}
            onChange={(v) => set("acceptsSponsored", v)}
          />
          <Toggle
            label="App active on the network"
            description="Pause to stop showing and being shown."
            checked={form.status === "ACTIVE"}
            onChange={(v) => set("status", v ? "ACTIVE" : "PAUSED")}
          />
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {saved ? <span className="text-sm text-positive">Saved ✓</span> : null}
        {error ? <span className="text-sm text-error">{error}</span> : null}
      </div>
    </div>
  );
}

export function DeleteAppButton({ slug, appId }: { slug: string; appId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return confirm ? (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted">Delete this app?</span>
      <Button
        variant="danger"
        size="sm"
        onClick={() =>
          start(async () => {
            await deleteApp(slug, appId);
            router.push(`/dashboard/${slug}/apps`);
          })
        }
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>
        Cancel
      </Button>
    </div>
  ) : (
    <Button variant="ghost" size="sm" onClick={() => setConfirm(true)} className="text-error">
      Delete app
    </Button>
  );
}
