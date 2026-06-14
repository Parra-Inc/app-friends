# App Friends — architecture & data model

## The idea

A cross-promotion network for app developers, plus the SDK that powers it.

- Developers create a **workspace**, register their **apps**, and connect **App
  Store Connect** to import metadata (or enter it by hand).
- Each workspace mints **API keys**. The SDK ships with a publishable key.
- The SDK is initialized with the host app's **bundle id**. When it wants to show
  a promo, it asks the network: `GET /api/v1/sdk/promotions?bundleId=…`.
- The network returns a ranked list of **promos** — *other* apps to show, never
  the caller's own. The SDK renders a **popup** or a **full-screen** unit, opens
  the App Store on tap, and reports **events** (impression / tap / install).

Two supply sources feed `promotions`:

1. **Pairings (view-for-view, free).** Two apps that don't compete agree to show
   each other. The network keeps the exchange roughly balanced (you can't take
   forever without giving).
2. **Campaigns (sponsored, paid).** An advertiser app pays to appear in apps it
   targets. Every publisher **approves** which advertisers may run inside their
   apps. Billed CPI or CPM via Stripe.

## Why "no customer overlap"

Friends should not be competitors. When suggesting pairings we exclude apps in
the same primary category and any app the workspace already owns. Developers can
still decline. Sponsored campaigns may target by category but the publisher's
explicit approval is always required.

## Components

```
web/                       Next.js 16 app
  app/
    (marketing)            landing, pricing, for-developers, legal
    docs/                  developer documentation (MDX-free, server components)
    auth/                  sign-in
    dashboard/             the product
    api/
      auth/[...nextauth]
      v1/
        sdk/               ← the network (API-key auth)
          promotions
          events
          config
        workspaces/        dashboard CRUD (session auth)
        apps/
        keys/
        pairings/
        campaigns/
        approvals/
        analytics/
        billing/
        asc/               App Store Connect connect + import
        members/ invitations/
        webhooks/stripe
        cron/rollup
  lib/                     server utilities
  components/              UI
  prisma/schema/          data model
sdks/swift/                AppFriends SwiftUI package
sdks/react-native/         @parra/app-friends
```

## Data model (Prisma)

Ids are prefixed UUIDs generated in Postgres.

### Identity & teams
- **User** `usr_` — NextAuth user.
- **Account / Session / VerificationToken** — NextAuth.
- **Workspace** `wsp_` — a developer/company. Holds Stripe customer, plan, and
  network reputation (give/take balance). Slug is unique.
- **Membership** `mbr_` — user ↔ workspace with role OWNER/ADMIN/MEMBER.
- **Invitation** `inv_` — pending email invite to a workspace.

### Apps & creative
- **App** `app_` — a registered app. `bundleId` (unique), `platform`
  (IOS/ANDROID), name, subtitle, `iconUrl`, `storeUrl`, `storeId`, primary
  `category`, status, and **promo creative** used when this app is shown
  elsewhere (`promoHeadline`, `promoSubtitle`, `promoScreenshots[]`). An app is
  both *publisher* (shows promos) and *advertiser* (gets shown).
- **AscCredential** `asc_` — App Store Connect API key for a workspace (issuer
  id, key id, encrypted P8 private key). Used to import apps + metadata.

### Keys
- **ApiKey** `key_` — workspace-scoped. `prefix` (`afp_` publishable / `afs_`
  secret), `hash`, label, `lastUsedAt`, `revokedAt`. Publishable keys are safe in
  client SDKs; secret keys are for server-to-server.

### Network supply
- **Pairing** `par_` — links `appA` ↔ `appB`. status REQUESTED / ACTIVE /
  DECLINED / PAUSED. `requestedByWorkspaceId`. The reciprocal cross-promo unit.
- **Campaign** `cmp_` — an advertiser app buying placement. `pricingModel`
  (CPI/CPM), `bidCents`, `dailyBudgetCents`, `totalBudgetCents`, `spentCents`,
  targeting (`targetCategories[]`, `targetPlatforms[]`, `targetCountries[]`),
  status DRAFT / ACTIVE / PAUSED / DEPLETED / ENDED.
- **AdApproval** `apr_` — publisher app/workspace approves an advertiser
  workspace (or a specific campaign) to run inside it. status PENDING /
  APPROVED / BLOCKED. Required before a campaign can serve in a publisher app.

### Events & analytics
- **PromoEvent** `evt_` — append-only impression / tap / install, with the
  publisher app, promoted app, source (PAIRING/CAMPAIGN), placement, and an
  opaque `token` issued at impression time and echoed back on tap/install (so we
  attribute and dedupe).
- **DailyStat** `day_` — per (app × counterpart-app × source × day) rollup of
  impressions / taps / installs / spendCents. Powers dashboards cheaply.

### Billing
- **Subscription** `sub_` — Stripe subscription for Pro + the source of truth for
  campaign spend settlement.
- **WebhookEvent** `whe_` — Stripe idempotency.

## The promotions algorithm

`GET /api/v1/sdk/promotions?bundleId=&placement=&limit=`

1. Authenticate the API key → workspace. Resolve the host **App** by `bundleId`
   within (or across) that workspace; 404 if unknown.
2. Build the candidate pool, excluding: the host app itself, any app in the host
   workspace, blocked advertisers, same-primary-category apps (overlap guard,
   relaxable per pairing).
3. **Sponsored** candidates: ACTIVE campaigns whose targeting matches the host
   app and that the host app has APPROVED (or auto-approve is on), with remaining
   budget. Rank by effective value (`bidCents`, adjusted CPM/CPI).
4. **Pairing** candidates: apps with an ACTIVE pairing to the host app. Rank by
   the give/take balance (favor apps we owe impressions to) + freshness.
5. Interleave sponsored and pairing by a configurable fill ratio, dedupe by app,
   take `limit`. Issue an impression `token` per promo (signed, TTL'd).
6. Return promo cards: id, app name/subtitle/icon/screenshots/store url/rating,
   placement, source, cta, and the `token`.

`POST /api/v1/sdk/events` accepts a batch of `{token, type}` where type is
`impression | tap | install`. We rate-limit, dedupe by token+type, write
`PromoEvent`, and increment `DailyStat` + campaign `spentCents`.

## Auth

- Dashboard: NextAuth session (`assertApiUser`).
- SDK: API key (`assertSdkKey`) — bearer `afp_…`/`afs_…` or `X-AppFriends-Key`.
  Publishable keys may call read + events; secret keys may call everything.

## Billing model

- **Free**: 1 app, view-for-view pairings, basic analytics.
- **Pro** ($19/mo workspace): unlimited apps, advanced analytics, priority fill,
  campaign creation.
- **Sponsored spend**: campaigns are prepaid wallet or metered to a Stripe
  subscription; `spentCents` settles nightly.

## SDK contract

The request/response shapes live in `web/lib/sdk/contract.ts` and are mirrored in
both SDKs. Versioned under `/api/v1`.

## Milestones

1. ✅ Schema + lib + auth.
2. ✅ SDK API (promotions/events/config).
3. ✅ Dashboard API + UI.
4. ✅ Marketing + docs.
5. ✅ iOS + RN SDKs.
6. Seed, smoke, deploy (Vercel + Neon + Stripe live keys).
