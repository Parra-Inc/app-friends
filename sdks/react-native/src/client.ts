import {
  SDK_DEFAULTS,
  type EventInput,
  type EventsRequest,
  type EventsResponse,
  type Placement,
  type Promo,
  type PromotionsResponse,
  type SdkConfig,
} from "./contract";

/** Options passed to {@link AppFriends.configure}. */
export interface AppFriendsOptions {
  /** Publishable API key. Looks like `afp_…`. */
  apiKey: string;
  /** The host app's bundle id, e.g. `com.acme.notes`. */
  bundleId: string;
  /** Override the API base URL. Defaults to `https://appfriends.dev`. */
  baseURL?: string;
  /**
   * Optional default country (ISO-3166 alpha-2) sent with requests and events.
   * Most hosts can leave this unset; the server infers it when omitted.
   */
  country?: string;
}

/** Arguments for {@link AppFriends.fetchPromotions}. */
export interface FetchPromotionsArgs {
  /** Placement to request. Falls back to the remote config's default. */
  placement?: Placement;
  /** Maximum number of promos to return. */
  limit?: number;
  /** Override the configured country for this call. */
  country?: string;
}

const DEFAULT_BASE_URL = "https://appfriends.dev";
const NOT_CONFIGURED =
  "[AppFriends] Not configured. Call AppFriends.configure({ apiKey, bundleId }) " +
  "in your app entry point before using the SDK.";

interface InternalConfig {
  apiKey: string;
  bundleId: string;
  baseURL: string;
  country?: string;
}

interface CacheEntry {
  promos: Promo[];
  /** Epoch millis after which the entry is stale. */
  expiresAtMs: number;
}

// ---------------------------------------------------------------------------
// Module-level singleton state.
// ---------------------------------------------------------------------------

let config: InternalConfig | null = null;

/** Promotions cache, keyed by `placement:limit:country`. */
const promoCache = new Map<string, CacheEntry>();

/** Pending events awaiting a debounced flush. */
let eventQueue: EventInput[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Milliseconds to wait before flushing a batch of events. */
const FLUSH_DEBOUNCE_MS = 1500;
/** Hard cap on a single events request, matching the server. */
const MAX_EVENTS_PER_FLUSH = 50;

function requireConfig(): InternalConfig {
  if (!config) throw new Error(NOT_CONFIGURED);
  return config;
}

function authHeaders(cfg: InternalConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${cfg.apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function cacheKey(placement: Placement, limit: number, country?: string): string {
  return `${placement}:${limit}:${country ?? ""}`;
}

function safeExpiry(expiresAt: string, fallbackSeconds: number): number {
  const parsed = Date.parse(expiresAt);
  if (Number.isFinite(parsed)) return parsed;
  return Date.now() + fallbackSeconds * 1000;
}

// ---------------------------------------------------------------------------
// Event batching.
// ---------------------------------------------------------------------------

function scheduleFlush(): void {
  if (flushTimer != null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushEvents();
  }, FLUSH_DEBOUNCE_MS);
}

/**
 * Send any queued events. Fire-and-forget — failures are swallowed so the host
 * app never sees an error from analytics. Safe to call manually (e.g. on
 * backgrounding) to flush early.
 */
export async function flushEvents(): Promise<void> {
  if (!config || eventQueue.length === 0) return;
  const cfg = config;

  const batch = eventQueue.slice(0, MAX_EVENTS_PER_FLUSH);
  eventQueue = eventQueue.slice(MAX_EVENTS_PER_FLUSH);

  const payload: EventsRequest = { events: batch };
  try {
    await fetch(`${cfg.baseURL}/api/v1/sdk/events`, {
      method: "POST",
      headers: authHeaders(cfg),
      body: JSON.stringify(payload),
    });
  } catch {
    // Swallow: analytics must never throw into the host app.
  }

  // Drain remaining events if the queue exceeded one batch.
  if (eventQueue.length > 0) scheduleFlush();
}

function enqueueEvent(input: EventInput): void {
  if (!config) return; // No-op until configured.
  eventQueue.push(input);
  if (eventQueue.length >= MAX_EVENTS_PER_FLUSH) {
    void flushEvents();
  } else {
    scheduleFlush();
  }
}

// ---------------------------------------------------------------------------
// Public API.
// ---------------------------------------------------------------------------

/**
 * The App Friends client — a configured singleton.
 *
 * @example
 * ```ts
 * import { AppFriends } from "@parra/app-friends";
 *
 * AppFriends.configure({
 *   apiKey: "afp_live_xxx",
 *   bundleId: "com.acme.notes",
 * });
 * ```
 */
export const AppFriends = {
  /**
   * Configure the SDK. Call once, early in your app's lifecycle (e.g. your root
   * component module or `index.js`). Re-calling replaces the configuration and
   * clears any cached inventory.
   */
  configure(options: AppFriendsOptions): void {
    if (!options?.apiKey) throw new Error("[AppFriends] configure: apiKey is required.");
    if (!options?.bundleId) throw new Error("[AppFriends] configure: bundleId is required.");

    config = {
      apiKey: options.apiKey,
      bundleId: options.bundleId,
      baseURL: (options.baseURL ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
      country: options.country,
    };
    promoCache.clear();
  },

  /** Whether {@link configure} has been called. */
  isConfigured(): boolean {
    return config != null;
  },

  /** The configured bundle id. Throws if not configured. */
  get bundleId(): string {
    return requireConfig().bundleId;
  },

  /**
   * Fetch the remote SDK configuration for this app.
   * Returns `null` on any network/parse failure so callers can fall back to
   * {@link SDK_DEFAULTS}.
   */
  async fetchConfig(): Promise<SdkConfig | null> {
    const cfg = requireConfig();
    const url = new URL(`${cfg.baseURL}/api/v1/sdk/config`);
    url.searchParams.set("bundleId", cfg.bundleId);

    try {
      const res = await fetch(url.toString(), { headers: authHeaders(cfg) });
      if (!res.ok) return null;
      return (await res.json()) as SdkConfig;
    } catch {
      return null;
    }
  },

  /**
   * Fetch promos to show. Results are cached in memory per
   * placement/limit/country until the server's `expiresAt`. Returns an empty
   * array when there's no inventory or on failure — never throws.
   */
  async fetchPromotions(args: FetchPromotionsArgs = {}): Promise<Promo[]> {
    const cfg = requireConfig();

    const placement = args.placement ?? SDK_DEFAULTS.defaultPlacement;
    const limit = args.limit ?? SDK_DEFAULTS.maxPromos;
    const country = args.country ?? cfg.country;

    const key = cacheKey(placement, limit, country);
    const cached = promoCache.get(key);
    if (cached && cached.expiresAtMs > Date.now()) {
      return cached.promos;
    }

    const url = new URL(`${cfg.baseURL}/api/v1/sdk/promotions`);
    url.searchParams.set("bundleId", cfg.bundleId);
    url.searchParams.set("placement", placement);
    url.searchParams.set("limit", String(limit));
    if (country) url.searchParams.set("country", country);

    try {
      const res = await fetch(url.toString(), { headers: authHeaders(cfg) });
      if (!res.ok) return [];

      const data = (await res.json()) as PromotionsResponse;
      const promos = Array.isArray(data.promos) ? data.promos : [];

      promoCache.set(key, {
        promos,
        expiresAtMs: safeExpiry(data.expiresAt, SDK_DEFAULTS.cacheSeconds),
      });
      return promos;
    } catch {
      return [];
    }
  },

  /** Clear the in-memory promotions cache, forcing the next fetch to hit the network. */
  clearCache(): void {
    promoCache.clear();
  },

  /** Queue an impression event for a promo. Fire-and-forget. */
  reportImpression(promo: Promo, country?: string): void {
    enqueueEvent({ token: promo.token, type: "impression", country: country ?? config?.country });
  },

  /** Queue a tap event for a promo. Fire-and-forget. */
  reportTap(promo: Promo, country?: string): void {
    enqueueEvent({ token: promo.token, type: "tap", country: country ?? config?.country });
  },

  /** Queue an install event for a promo. Fire-and-forget. */
  reportInstall(promo: Promo, country?: string): void {
    enqueueEvent({ token: promo.token, type: "install", country: country ?? config?.country });
  },

  /** Flush any queued events immediately. Useful when the app backgrounds. */
  flush(): Promise<void> {
    return flushEvents();
  },

  /**
   * Send a raw events response request and resolve the count the server
   * accepted. Mostly for tests/diagnostics — prefer the `report*` helpers.
   */
  async sendEvents(events: EventInput[]): Promise<EventsResponse> {
    const cfg = requireConfig();
    const payload: EventsRequest = { events };
    const res = await fetch(`${cfg.baseURL}/api/v1/sdk/events`, {
      method: "POST",
      headers: authHeaders(cfg),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { accepted: 0 };
    return (await res.json()) as EventsResponse;
  },
};
