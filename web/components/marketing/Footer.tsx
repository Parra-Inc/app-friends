import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const groups = [
  {
    title: "Product",
    links: [
      { href: "/#how", label: "How it works" },
      { href: "/#network", label: "The network" },
      { href: "/pricing", label: "Pricing" },
      { href: "/docs", label: "Docs" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/docs/quickstart", label: "Quickstart" },
      { href: "/docs/ios", label: "iOS SDK" },
      { href: "/docs/react-native", label: "React Native SDK" },
      { href: "/docs/api", label: "API reference" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "mailto:hello@appfriends.dev", label: "Contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-rule bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">
              Trade installs with apps that aren&apos;t your competition. Free to
              join, free to pair.
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                {g.title}
              </h4>
              <ul className="mt-3 space-y-2">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-ink-soft transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-rule pt-6 text-sm text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} App Friends. All rights reserved.</p>
          <p>Made for app developers, by app developers.</p>
        </div>
      </div>
    </footer>
  );
}
