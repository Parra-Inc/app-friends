"use client";

import Link from "next/link";
import { useState } from "react";
import { Mark, Wordmark } from "@/components/brand/Logo";
import { handleSignOut } from "@/lib/actions/auth-signout";

interface WorkspaceLite {
  slug: string;
  name: string;
  plan: string;
}

const navItems = [
  { seg: "", label: "Overview", icon: "▣" },
  { seg: "apps", label: "Apps", icon: "▦" },
  { seg: "network", label: "Network", icon: "⇄" },
  { seg: "campaigns", label: "Campaigns", icon: "◎" },
  { seg: "analytics", label: "Analytics", icon: "▤" },
  { seg: "keys", label: "API keys", icon: "⚿" },
  { seg: "billing", label: "Billing", icon: "▱" },
  { seg: "settings", label: "Settings", icon: "⚙" },
];

export function Sidebar({
  workspaces,
  currentSlug,
  pathname,
  userName,
  userEmail,
}: {
  workspaces: WorkspaceLite[];
  currentSlug: string;
  pathname: string;
  userName: string;
  userEmail: string;
}) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const current =
    workspaces.find((w) => w.slug === currentSlug) ?? workspaces[0];

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-rule bg-paper">
      <div className="flex items-center gap-2 px-5 py-4">
        <Mark size={24} />
        <Wordmark className="text-base" />
      </div>

      {/* Workspace switcher */}
      <div className="relative px-3">
        <button
          onClick={() => setSwitcherOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-rule bg-paper-raised px-3 py-2 text-left text-sm hover:border-brand/40"
        >
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">
              {current?.name ?? "Workspace"}
            </span>
            <span className="block text-xs text-muted">
              {current?.plan === "PRO" ? "Pro" : "Free"} plan
            </span>
          </span>
          <span className="text-muted">▾</span>
        </button>
        {switcherOpen ? (
          <div className="absolute inset-x-3 z-20 mt-1 overflow-hidden rounded-xl border border-rule bg-paper-raised shadow-lg">
            {workspaces.map((w) => (
              <Link
                key={w.slug}
                href={`/dashboard/${w.slug}`}
                onClick={() => setSwitcherOpen(false)}
                className={`block px-3 py-2 text-sm hover:bg-brand-soft/50 ${
                  w.slug === currentSlug ? "text-brand" : "text-ink-soft"
                }`}
              >
                {w.name}
              </Link>
            ))}
            <Link
              href="/dashboard/new"
              onClick={() => setSwitcherOpen(false)}
              className="block border-t border-rule px-3 py-2 text-sm text-muted hover:bg-brand-soft/50"
            >
              + New workspace
            </Link>
          </div>
        ) : null}
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const href = `/dashboard/${currentSlug}${item.seg ? `/${item.seg}` : ""}`;
          const active =
            item.seg === ""
              ? pathname === `/dashboard/${currentSlug}`
              : pathname.startsWith(href);
          return (
            <Link
              key={item.seg}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-brand-soft text-brand"
                  : "text-ink-soft hover:bg-brand-soft/40 hover:text-ink"
              }`}
            >
              <span className="w-4 text-center opacity-70">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-rule p-3">
        <div className="px-2 pb-2">
          <div className="truncate text-sm font-medium text-ink">{userName}</div>
          <div className="truncate text-xs text-muted">{userEmail}</div>
        </div>
        <form action={handleSignOut}>
          <button className="w-full rounded-xl px-3 py-2 text-left text-sm text-ink-soft hover:bg-brand-soft/40 hover:text-ink">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
