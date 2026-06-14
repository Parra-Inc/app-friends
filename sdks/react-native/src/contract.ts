/**
 * The SDK ↔ API contract for App Friends.
 *
 * These shapes mirror `web/lib/sdk/contract.ts` on the server, which is the
 * source of truth. The Swift and React Native SDKs both target them. Versioned
 * under `/api/v1`.
 *
 * Endpoints:
 *   GET  /api/v1/sdk/config       → {@link SdkConfig}
 *   GET  /api/v1/sdk/promotions   → {@link PromotionsResponse}
 *   POST /api/v1/sdk/events       ← {@link EventsRequest} → {@link EventsResponse}
 *
 * Auth: API key in `Authorization: Bearer afp_…`.
 */

/** Where a promo is rendered. */
export type Placement = "POPUP" | "FULLSCREEN" | "BANNER";

/** How a promo entered the network: an even view-for-view pairing, or a paid campaign. */
export type PromoSourceWire = "PAIRING" | "CAMPAIGN";

/** The kinds of events the SDK reports back. */
export type EventType = "impression" | "tap" | "install";

/** A single app to show the user. */
export interface Promo {
  /** Stable id of this promo card (the promoted app's id). */
  id: string;
  /** Opaque token — echo it back on tap/install events for attribution. */
  token: string;
  source: PromoSourceWire;
  placement: Placement;

  appName: string;
  subtitle: string | null;
  /** Marketing headline overriding subtitle when present. */
  headline: string | null;
  iconUrl: string | null;
  screenshots: string[];
  storeUrl: string | null;
  category: string | null;
  ratingAvg: number | null;
  ratingCount: number | null;

  /** Call-to-action label, e.g. "Get". */
  cta: string;
  /** True when this is a paid placement (disclose as "Sponsored"). */
  sponsored: boolean;
}

/** Response body of `GET /api/v1/sdk/promotions`. */
export interface PromotionsResponse {
  promos: Promo[];
  /** Server time (ISO) — clients may cache until `expiresAt`. */
  servedAt: string;
  expiresAt: string;
  placement: Placement;
}

/** One event in an `EventsRequest`. */
export interface EventInput {
  token: string;
  type: EventType;
  /** Optional ISO-3166 alpha-2 country for analytics. */
  country?: string;
}

/** Request body of `POST /api/v1/sdk/events`. */
export interface EventsRequest {
  events: EventInput[];
}

/** Response body of `POST /api/v1/sdk/events`. */
export interface EventsResponse {
  accepted: number;
}

/** Remote SDK configuration. Lets the network tune behaviour without an app update. */
export interface SdkConfig {
  /** Whether the network has any inventory for this app right now. */
  enabled: boolean;
  /** Seconds the client may cache a promotions response. */
  cacheSeconds: number;
  /** Minimum seconds between full-screen takeovers. */
  minIntervalSeconds: number;
  /** Default placement when the host doesn't specify one. */
  defaultPlacement: Placement;
  /** Theme accent (hex) the host can use for the CTA, mirrors the app's brand. */
  accentColor: string | null;
}

/** Client-side fallbacks, mirroring the server's `SDK_DEFAULTS`. */
export const SDK_DEFAULTS = {
  cacheSeconds: 300,
  minIntervalSeconds: 120,
  defaultPlacement: "POPUP" as Placement,
  maxPromos: 10,
} as const;
