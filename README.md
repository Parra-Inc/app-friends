# App Friends

**Trade installs with apps that aren't your competition.**

App Friends is a cross-promotion network and SDK for app developers. Register
your apps, drop in the SDK, and show promos for *other* apps inside yours — while
those apps show yours. Pair up with non-competing apps for free (view-for-view),
or pay for sponsored placement in apps you choose.

```
   Your app  ──shows──▶  Friend's app
   Your app  ◀──shows──  Friend's app
```

The SDK is called with the current app's bundle id. The network returns every
*other* app you're allowed to promote — never your own — and renders them as a
full-screen takeover or a popup card. You get the installs; you keep the user.

## What's in here

```
app-friends/
├── web/                 Next.js 16 SaaS — marketing, docs, dashboard, API
├── sdks/
│   ├── swift/           AppFriends — Swift Package (SwiftUI), iOS 16+
│   └── react-native/    @parra/app-friends — RN / Expo
└── docs/                Product plan, brand brief, data model
```

## The product, in three parts

1. **Dashboard** (`web/app/dashboard`) — register apps, connect App Store
   Connect, mint API keys, find friends, run/approve sponsored campaigns, watch
   analytics, manage billing and your team.
2. **API** (`web/app/api/v1`) — the network. The SDK hits
   `GET /api/v1/sdk/promotions?bundleId=…` with an API key and gets back the
   apps to show. Events (impressions / taps / installs) flow back to
   `POST /api/v1/sdk/events`.
3. **SDKs** (`sdks/`) — drop-in views for iOS (SwiftUI) and React Native that
   fetch promotions, render the popup or full-screen unit, open the App Store,
   and report events.

## Two ways to promote

- **View-for-view (free).** Form a *pairing* with an app that doesn't compete
  with yours. You show theirs, they show yours. The network keeps it balanced.
- **Sponsored (paid).** Run a *campaign* to appear in apps you target. Each
  publisher approves which advertisers can run in their app. CPI or CPM.

## Quick start

```bash
cd web
pnpm install
pnpm dev          # docker up → schema sync → seed → servers
```

`pnpm dev` runs [`scripts/dev.sh`](scripts/dev.sh): it brings up Postgres +
MailHog, syncs the schema, **seeds a sample tenant** (see below), then starts the
web app. Use `pnpm dev:force` to wipe the database and reseed from scratch,
`pnpm dev --no-seed` to skip seeding, `pnpm dev --studio` to also run Prisma
Studio, or `pnpm dev:tunnel` to expose the server through ngrok for SDK testing.

- Web / dashboard: http://localhost:3053
- MailHog inbox: http://localhost:8055
- Prisma Studio: http://localhost:5575

### Sample tenant

The seed ([`scripts/seed.ts`](web/scripts/seed.ts)) creates a workspace you own —
**Nimbus Labs** (PRO) with two apps — plus a few "friend" tenants that supply
network inventory (an active pairing, a pending pairing request, and an approved
sponsored campaign), and a couple weeks of analytics.

- **Sign in:** open http://localhost:3053/auth/signin, enter
  `demo@appfriends.dev`, then click the magic link in
  [MailHog](http://localhost:8055). You land in the Nimbus Labs workspace.
- **SDK key:** the sample tenant ships a stable publishable key,
  `afp_dev_sample_publishable_key_00000001`. Try it:

  ```bash
  curl -H 'Authorization: Bearer afp_dev_sample_publishable_key_00000001' \
    'http://localhost:3053/api/v1/sdk/promotions?bundleId=com.nimbuslabs.weather'
  ```

The marketing site and dashboard shell render with just `DATABASE_URL` and
`AUTH_SECRET`. Everything else (`STRIPE_*`, App Store Connect, Upstash, email)
unlocks progressively. See [`web/.env.example`](web/.env.example).

## SDKs

- iOS: [`sdks/swift/README.md`](sdks/swift/README.md) — runnable example in
  [`sdks/swift/Example`](sdks/swift/Example)
- React Native: [`sdks/react-native/README.md`](sdks/react-native/README.md) —
  runnable example in [`sdks/react-native/example`](sdks/react-native/example)

Both examples pose as the seeded **Nimbus Weather** app and talk to your local
server, so they render the friends the seed sets up. Start `pnpm dev` first.

## Docs

Architecture and data model: [`docs/PLAN.md`](docs/PLAN.md). Brand and voice:
[`docs/BRAND.md`](docs/BRAND.md). Developer-facing docs render in-app at
`/docs`.

## Stack

Next.js 16 · React 19 · TypeScript 5 · Prisma 7 + PostgreSQL 16 · NextAuth 5 ·
Tailwind 4 · Stripe · Cloudflare Email + MailHog · Upstash (rate-limit) · Swift 6 /
SwiftUI · React Native. pnpm.
