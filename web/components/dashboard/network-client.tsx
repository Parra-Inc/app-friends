"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select, Input } from "@/components/ui/form";
import { Card, Badge, EmptyState } from "@/components/ui/display";
import { AppIcon } from "@/components/dashboard/AppIcon";
import {
  sendPairingRequest,
  respondPairing,
  setPairingPaused,
} from "@/lib/actions/pairings";
import { decideApproval } from "@/lib/actions/approvals";
import { discoverFriends } from "@/lib/actions/network-read";
import type { DiscoverableApp } from "@/lib/network/discovery";

export interface MyApp {
  id: string;
  name: string;
  iconUrl: string | null;
  category: string | null;
}
export interface Friend {
  pairingId: string;
  status: string;
  hostBalance: number;
  myAppName: string;
  partnerName: string;
  partnerIcon: string | null;
  partnerCategory: string | null;
}
export interface IncomingReq {
  pairingId: string;
  fromName: string;
  fromIcon: string | null;
  toName: string;
  message: string | null;
}
export interface OutgoingReq {
  pairingId: string;
  toName: string;
  toIcon: string | null;
  status: string;
}
export interface AdvReq {
  publisherAppId: string;
  campaignId: string;
  campaignName: string;
  advertiserAppName: string;
  advertiserIcon: string | null;
  publisherAppName: string;
  bidLabel: string;
}

type Tab = "friends" | "requests" | "discover" | "advertisers";

export function NetworkClient(props: {
  slug: string;
  myApps: MyApp[];
  friends: Friend[];
  incoming: IncomingReq[];
  outgoing: OutgoingReq[];
  advertisers: AdvReq[];
}) {
  const [tab, setTab] = useState<Tab>(
    props.incoming.length > 0
      ? "requests"
      : props.advertisers.length > 0
        ? "advertisers"
        : "friends"
  );

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "friends", label: "Friends", count: props.friends.length },
    { id: "requests", label: "Requests", count: props.incoming.length + props.outgoing.length },
    { id: "discover", label: "Discover" },
    { id: "advertisers", label: "Advertisers", count: props.advertisers.length },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1 border-b border-rule">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative -mb-px flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-brand text-brand"
                : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
            {t.count ? (
              <span className="rounded-full bg-rule px-1.5 text-xs text-ink-soft">
                {t.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "friends" && <FriendsTab slug={props.slug} friends={props.friends} />}
      {tab === "requests" && (
        <RequestsTab slug={props.slug} incoming={props.incoming} outgoing={props.outgoing} />
      )}
      {tab === "discover" && <DiscoverTab slug={props.slug} myApps={props.myApps} />}
      {tab === "advertisers" && (
        <AdvertisersTab slug={props.slug} advertisers={props.advertisers} />
      )}
    </div>
  );
}

function FriendsTab({ slug, friends }: { slug: string; friends: Friend[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  if (friends.length === 0) {
    return (
      <EmptyState
        title="No friends yet"
        description="Head to Discover to find apps that complement yours, then send a pairing request."
      />
    );
  }
  return (
    <div className="grid gap-3">
      {friends.map((f) => (
        <Card key={f.pairingId} className="flex items-center gap-4 p-4">
          <AppIcon src={f.partnerIcon} name={f.partnerName} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-ink">{f.partnerName}</span>
              {f.status === "PAUSED" ? <Badge tone="muted">paused</Badge> : <Badge tone="positive">active</Badge>}
            </div>
            <div className="text-xs text-muted">
              paired with {f.myAppName}
              {f.partnerCategory ? ` · ${f.partnerCategory}` : ""}
            </div>
          </div>
          <div className="hidden text-right text-xs text-muted sm:block">
            <BalanceLabel value={f.hostBalance} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              start(async () => {
                await setPairingPaused(slug, {
                  pairingId: f.pairingId,
                  paused: f.status !== "PAUSED",
                });
                router.refresh();
              })
            }
          >
            {pending ? "…" : f.status === "PAUSED" ? "Resume" : "Pause"}
          </Button>
        </Card>
      ))}
    </div>
  );
}

function BalanceLabel({ value }: { value: number }) {
  if (value === 0) return <span>even</span>;
  if (value > 0)
    return <span className="text-positive">you&apos;re owed {value}</span>;
  return <span className="text-accent">you owe {Math.abs(value)}</span>;
}

function RequestsTab({
  slug,
  incoming,
  outgoing,
}: {
  slug: string;
  incoming: IncomingReq[];
  outgoing: OutgoingReq[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function respond(pairingId: string, accept: boolean) {
    start(async () => {
      await respondPairing(slug, { pairingId, accept });
      router.refresh();
    });
  }

  if (incoming.length === 0 && outgoing.length === 0) {
    return <EmptyState title="No pending requests" description="Pairing requests you send and receive show up here." />;
  }

  return (
    <div className="space-y-8">
      {incoming.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Incoming
          </h3>
          <div className="grid gap-3">
            {incoming.map((r) => (
              <Card key={r.pairingId} className="p-4">
                <div className="flex items-center gap-4">
                  <AppIcon src={r.fromIcon} name={r.fromName} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-ink">
                      {r.fromName} wants to pair with {r.toName}
                    </div>
                    {r.message ? (
                      <div className="mt-0.5 text-sm text-muted">“{r.message}”</div>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => respond(r.pairingId, true)} disabled={pending}>
                      Accept
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => respond(r.pairingId, false)} disabled={pending}>
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {outgoing.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Sent
          </h3>
          <div className="grid gap-3">
            {outgoing.map((r) => (
              <Card key={r.pairingId} className="flex items-center gap-4 p-4">
                <AppIcon src={r.toIcon} name={r.toName} />
                <div className="flex-1 font-medium text-ink">{r.toName}</div>
                <Badge tone={r.status === "DECLINED" ? "error" : "muted"}>
                  {r.status.toLowerCase()}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DiscoverTab({ slug, myApps }: { slug: string; myApps: MyApp[] }) {
  const [forAppId, setForAppId] = useState(myApps[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [includeOverlap, setIncludeOverlap] = useState(false);
  const [results, setResults] = useState<DiscoverableApp[] | null>(null);
  const [pending, start] = useTransition();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  function search() {
    if (!forAppId) return;
    start(async () => {
      const res = await discoverFriends(slug, { forAppId, query, includeOverlap });
      if (res.ok && res.data) setResults(res.data.apps);
    });
  }

  function sendReq(toAppId: string) {
    start(async () => {
      const res = await sendPairingRequest(slug, { fromAppId: forAppId, toAppId });
      if (res.ok) setSentIds((s) => new Set(s).add(toAppId));
    });
  }

  if (myApps.length === 0) {
    return <EmptyState title="Add an app first" description="You need at least one app to find friends." />;
  }

  return (
    <div>
      <Card className="mb-5 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Find friends for</span>
            <Select value={forAppId} onChange={(e) => setForAppId(e.target.value)}>
              {myApps.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Search</span>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="App name…"
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
          </label>
          <Button onClick={search} disabled={pending}>
            {pending ? "Searching…" : "Search"}
          </Button>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={includeOverlap}
            onChange={(e) => setIncludeOverlap(e.target.checked)}
          />
          Include same-category apps (competitors)
        </label>
      </Card>

      {results === null ? (
        <p className="text-sm text-muted">Run a search to see apps you can pair with.</p>
      ) : results.length === 0 ? (
        <EmptyState title="No matches" description="Try a different app or include same-category apps." />
      ) : (
        <div className="grid gap-3">
          {results.map((a) => {
            const sent = sentIds.has(a.id) || a.pairingStatus === "REQUESTED";
            const active = a.pairingStatus === "ACTIVE";
            return (
              <Card key={a.id} className="flex items-center gap-4 p-4">
                <AppIcon src={a.iconUrl} name={a.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-ink">{a.name}</div>
                  <div className="truncate text-xs text-muted">
                    {a.category ?? "—"} · by {a.workspaceName}
                  </div>
                </div>
                {active ? (
                  <Badge tone="positive">friends</Badge>
                ) : sent ? (
                  <Badge tone="muted">requested</Badge>
                ) : (
                  <Button size="sm" onClick={() => sendReq(a.id)} disabled={pending}>
                    Send request
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdvertisersTab({ slug, advertisers }: { slug: string; advertisers: AdvReq[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function decide(a: AdvReq, status: "APPROVED" | "BLOCKED") {
    start(async () => {
      await decideApproval(slug, {
        publisherAppId: a.publisherAppId,
        campaignId: a.campaignId,
        status,
      });
      router.refresh();
    });
  }

  if (advertisers.length === 0) {
    return (
      <EmptyState
        title="No advertisers waiting"
        description="When someone wants to run a sponsored placement in your app, you'll approve them here."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {advertisers.map((a) => (
        <Card key={`${a.publisherAppId}:${a.campaignId}`} className="p-4">
          <div className="flex items-center gap-4">
            <AppIcon src={a.advertiserIcon} name={a.advertiserAppName} />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-ink">{a.advertiserAppName}</div>
              <div className="text-xs text-muted">
                wants to run in {a.publisherAppName} · {a.bidLabel}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => decide(a, "APPROVED")} disabled={pending}>
                Approve
              </Button>
              <Button variant="ghost" size="sm" className="text-error" onClick={() => decide(a, "BLOCKED")} disabled={pending}>
                Block
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
