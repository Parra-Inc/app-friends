/**
 * The SDK ↔ API contract. This file is the source of truth; the Swift and React
 * Native SDKs mirror these shapes. Versioned under /api/v1.
 *
 * Endpoints:
 *   GET  /api/v1/sdk/config       → SdkConfig
 *   GET  /api/v1/sdk/promotions   → PromotionsResponse
 *   POST /api/v1/sdk/events       ← EventsRequest → { accepted: number }
 *
 * Auth: API key in `Authorization: Bearer afp_…` or header `X-AppFriends-Key`.
 */

export type Placement = "POPUP" | "FULLSCREEN" | "BANNER";
export type PromoSourceWire = "PAIRING" | "CAMPAIGN";
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

export interface PromotionsResponse {
  promos: Promo[];
  /** Server time (ISO) — clients may cache until `expiresAt`. */
  servedAt: string;
  expiresAt: string;
  placement: Placement;
}

export interface EventInput {
  token: string;
  type: EventType;
  /** Optional ISO-3166 country for analytics. */
  country?: string;
}

export interface EventsRequest {
  events: EventInput[];
}

export interface EventsResponse {
  accepted: number;
}

/** Remote SDK configuration. Lets us tune behaviour without an app update. */
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

export const SDK_DEFAULTS = {
  cacheSeconds: 300,
  minIntervalSeconds: 120,
  defaultPlacement: "POPUP" as Placement,
  tokenTtlSeconds: 1800,
  maxPromos: 10,
} as const;
