"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    title: "Get started",
    links: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/quickstart", label: "Quickstart" },
      { href: "/docs/dashboard", label: "Dashboard guide" },
    ],
  },
  {
    title: "SDKs",
    links: [
      { href: "/docs/ios", label: "iOS (SwiftUI)" },
      { href: "/docs/react-native", label: "React Native" },
    ],
  },
  {
    title: "Reference",
    links: [{ href: "/docs/api", label: "API reference" }],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();
  return (
    <nav className="space-y-6">
      {sections.map((s) => (
        <div key={s.title}>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {s.title}
          </h4>
          <ul className="space-y-0.5">
            {s.links.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-brand-soft font-medium text-brand"
                        : "text-ink-soft hover:bg-brand-soft/40 hover:text-ink"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
