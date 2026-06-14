# App Friends — agent rules

## Brand

Voice is plainspoken and developer-to-developer. See `docs/BRAND.md` for the full
brief; follow it for any user-facing copy or UI.

- Concrete over hype. Numbers and verbs, not adjectives.
- No banned words: revolutionary, empower, unlock, leverage, seamless, delightful,
  supercharge, game-changing, effortless, next-level.
- "Friends," not "partners." "Promos," not "ads," in view-for-view contexts;
  "sponsored" / "campaign" for the paid product.
- Positive framing. The network is cooperative, not extractive.

## Stack

- Next.js 16 (app router), React 19, TypeScript 5 — code lives in `web/`.
- Prisma 7 (PostgreSQL 16), multi-file schema at `web/prisma/schema/`.
- NextAuth 5 (Google + GitHub + Apple), JWT sessions.
- Tailwind CSS 4 (PostCSS plugin).
- Resend (prod) + MailHog (dev) via `lib/email/email-service.ts`.
- Upstash Redis for rate-limit / idempotency (optional in dev).
- Stripe for sponsored-campaign billing + Pro subscriptions.
- pnpm. Local web on :3050, Postgres :5455, MailHog :8055, Studio :5575.

## API conventions (`web/app/api/v1/*`)

- Two auth modes:
  - **Dashboard** routes → `assertApiUser()` (NextAuth session). Always filter by
    workspace membership.
  - **SDK** routes (`/api/v1/sdk/*`) → `assertSdkKey()` (API key in
    `Authorization: Bearer afp_…` / `afs_…` or `X-AppFriends-Key`). Scope to the
    key's workspace.
- Zod schemas for request bodies. Return `400` on parse failure.
- Throw `AppFriendsError` (see `lib/errors.ts`) and call `.toResponse()`.
- The SDK must NEVER receive the caller's own app in a promotions response.

## Data model

Prefixed UUID ids: `usr_`, `wsp_`, `mbr_`, `inv_`, `app_`, `key_`, `par_`
(pairing), `cmp_` (campaign), `crv_` (creative), `apr_` (ad approval), `evt_`,
`asc_` (App Store Connect credential), `sub_`, `whe_` (webhook event),
`day_` (daily stat). Full model in `docs/PLAN.md`.

## SDKs (`sdks/`)

- `sdks/swift` — `AppFriends` Swift package, SwiftUI, iOS 16+. Public API:
  `AppFriends.configure`, `.appFriendsPopup(...)` modifier, `AppFriendsFullScreen`.
- `sdks/react-native` — `@parra/app-friends`. `AppFriends.configure`,
  `<AppFriendsPopup/>`, `<AppFriendsFullScreen/>`, `useAppFriends()`.
- Both target the same API contract. Keep request/response shapes in sync with
  `web/lib/sdk/contract.ts` (the source of truth).

## Commit style

- Don't commit unless asked.
- Stage files by name (never `git add -A`).
- Use HEREDOC for commit messages.
