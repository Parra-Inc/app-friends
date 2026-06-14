import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/display";

/* ---------------------------------------------------------------- How it works */

const steps = [
  {
    n: "01",
    title: "Register your app",
    body: "Paste a bundle id or connect App Store Connect. We pull your icon, screenshots, and category automatically.",
  },
  {
    n: "02",
    title: "Find friends",
    body: "Browse apps that don't compete with yours and send a pairing request. Accept the ones that fit.",
  },
  {
    n: "03",
    title: "Drop in the SDK",
    body: "Three lines in your iOS or React Native app. When you call it, we return apps to show — never your own.",
  },
  {
    n: "04",
    title: "Trade installs",
    body: "You show theirs, they show yours. We keep the exchange balanced and report every impression, tap, and install.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-20">
      <div className="max-w-2xl">
        <Badge tone="accent">How it works</Badge>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Four steps to your first traded install.
        </h2>
        <p className="mt-3 text-ink-soft">
          No ad exchange, no media buyers, no minimums. Just developers helping
          each other find users.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <Card key={s.n} className="p-6">
            <div className="font-mono text-sm font-semibold text-brand">{s.n}</div>
            <h3 className="mt-3 text-lg font-semibold text-ink">{s.title}</h3>
            <p className="mt-2 text-sm text-muted">{s.body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Two modes */

export function TwoModes() {
  return (
    <section id="network" className="border-y border-rule bg-paper-raised">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-2xl">
          <Badge tone="brand">Two ways to grow</Badge>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Free when you trade. Paid when you want more.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Card className="p-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤝</span>
              <h3 className="text-xl font-semibold text-ink">View-for-view</h3>
              <Badge tone="positive" className="ml-auto">Free</Badge>
            </div>
            <p className="mt-3 text-ink-soft">
              Pair with an app that doesn&apos;t compete with yours. You show
              their promo, they show yours. The network keeps it balanced, so you
              always get back roughly what you give.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted">
              <li>• No spend, ever — it&apos;s a barter</li>
              <li>• Overlap guard hides direct competitors</li>
              <li>• You approve every friend</li>
            </ul>
          </Card>
          <Card className="p-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📣</span>
              <h3 className="text-xl font-semibold text-ink">Sponsored</h3>
              <Badge tone="accent" className="ml-auto">CPI / CPM</Badge>
            </div>
            <p className="mt-3 text-ink-soft">
              Want to reach beyond your pairings? Run a campaign and pay to appear
              in apps you target. Every publisher approves which advertisers run
              inside their app — so it stays clean.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted">
              <li>• Set a bid and a budget, pause anytime</li>
              <li>• Publishers earn from every placement</li>
              <li>• No opaque exchange in the middle</li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Code showcase */

const swift = `import AppFriends

// once, at launch
AppFriends.configure(apiKey: "afp_live_…")

// anywhere in SwiftUI
.appFriendsPopup(isPresented: $showPromo)`;

const rn = `import { AppFriends, AppFriendsPopup } from "@parra/app-friends";

AppFriends.configure({ apiKey: "afp_live_…" });

<AppFriendsPopup visible={show} onClose={() => setShow(false)} />`;

export function CodeShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Badge tone="accent">The SDK</Badge>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            It really is three lines.
          </h2>
          <p className="mt-3 text-ink-soft">
            Native SwiftUI views and React Native components. The SDK is called
            with your bundle id; the network decides what to show and tracks the
            result. Popup, full-screen, or banner.
          </p>
          <div className="mt-6 flex gap-3">
            <Button href="/docs/ios" variant="secondary" size="sm">iOS docs</Button>
            <Button href="/docs/react-native" variant="secondary" size="sm">
              React Native docs
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <CodeCard label="Swift / SwiftUI" code={swift} />
          <CodeCard label="React Native" code={rn} />
        </div>
      </div>
    </section>
  );
}

function CodeCard({ label, code }: { label: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-rule">
      <div className="flex items-center justify-between border-b border-rule bg-paper-raised px-4 py-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-positive/60" />
        </span>
      </div>
      <pre className="overflow-x-auto bg-ink p-4 text-[13px] leading-relaxed text-[#E9E5FF]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ---------------------------------------------------------------- FAQ */

const faqs = [
  {
    q: "How do you decide which apps to show?",
    a: "Your active pairings and any sponsored campaigns you've approved. We never show your own apps or another app from your workspace, and by default we hide same-category competitors.",
  },
  {
    q: "Is it really free?",
    a: "View-for-view is free forever — it's a barter, not a purchase. You only pay if you choose to run a sponsored campaign to reach beyond your pairings.",
  },
  {
    q: "Do I need App Store Connect?",
    a: "No. You can register an app with just its bundle id and we'll pull public metadata. Connecting App Store Connect lets you import your whole catalog at once.",
  },
  {
    q: "Which platforms are supported?",
    a: "iOS (SwiftUI) and React Native today, with the same API behind both. Android-native is on the roadmap.",
  },
  {
    q: "How is the exchange kept fair?",
    a: "Every impression updates a running balance per pairing. When you've shown a friend more than they've shown you, the network shifts to favor showing their app to you until it evens out.",
  },
];

export function FAQ() {
  return (
    <section className="border-t border-rule bg-paper-raised">
      <div className="mx-auto max-w-3xl px-5 py-20">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-ink">
          Questions, answered.
        </h2>
        <div className="mt-10 divide-y divide-rule">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-ink">
                {f.q}
                <span className="text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Final CTA */

export function FinalCTA() {
  return (
    <section className="brand-gradient">
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Your next users are already someone&apos;s.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">
          Join the network, pair with apps that complement yours, and start
          trading installs this week.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button href="/auth/signin" size="lg">Start for free</Button>
          <Button href="/pricing" variant="secondary" size="lg">See pricing</Button>
        </div>
      </div>
    </section>
  );
}
