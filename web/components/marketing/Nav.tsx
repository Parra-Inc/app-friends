"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/#network", label: "Network" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-rule/70 bg-paper/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Logo />
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button href="/auth/signin" variant="ghost" size="sm">
            Sign in
          </Button>
          <Button href="/auth/signin" size="sm">
            Get started
          </Button>
        </div>
        <button
          className="md:hidden text-ink-soft"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
          </svg>
        </button>
      </nav>
      {open ? (
        <div className="border-t border-rule bg-paper px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-ink-soft"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Button href="/auth/signin" variant="secondary" size="sm" className="flex-1">
                Sign in
              </Button>
              <Button href="/auth/signin" size="sm" className="flex-1">
                Get started
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
