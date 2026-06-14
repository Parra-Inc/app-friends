import { useCallback, useEffect, useRef, useState } from "react";
import { AppFriends } from "../client";
import type { Placement, Promo } from "../contract";

/** Arguments for {@link useAppFriends}. */
export interface UseAppFriendsArgs {
  /** Placement to request. Defaults to the remote config's default (POPUP). */
  placement?: Placement;
  /** Maximum number of promos to fetch. */
  limit?: number;
  /** Override the configured country for this fetch. */
  country?: string;
  /**
   * Skip fetching until you flip this to `true`. Handy for deferring inventory
   * loads until a sheet is about to open.
   */
  enabled?: boolean;
}

/** Return value of {@link useAppFriends}. */
export interface UseAppFriendsResult {
  /** The promos returned by the network. Empty when there's no inventory. */
  promos: Promo[];
  /** True while the first/most recent fetch is in flight. */
  loading: boolean;
  /** A non-null error if configuration is missing; network errors are swallowed. */
  error: Error | null;
  /** Re-fetch inventory, bypassing the in-memory cache. */
  reload: () => Promise<void>;
}

/**
 * Fetch App Friends promos for the configured app.
 *
 * `fetchPromotions` never throws and returns `[]` on network failure, so
 * `error` is generally only populated when the SDK isn't configured. Results
 * are cached in memory; `reload()` clears the cache and re-fetches.
 *
 * @example
 * ```tsx
 * const { promos, loading, reload } = useAppFriends({ placement: "POPUP" });
 * ```
 */
export function useAppFriends(args: UseAppFriendsArgs = {}): UseAppFriendsResult {
  const { placement, limit, country, enabled = true } = args;

  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  // Track mount state so we never set state after unmount.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(
    async (bypassCache: boolean) => {
      if (!AppFriends.isConfigured()) {
        if (mounted.current) {
          setError(
            new Error(
              "[AppFriends] Not configured. Call AppFriends.configure() before using useAppFriends()."
            )
          );
          setLoading(false);
        }
        return;
      }

      if (mounted.current) {
        setLoading(true);
        setError(null);
      }

      if (bypassCache) AppFriends.clearCache();

      const result = await AppFriends.fetchPromotions({ placement, limit, country });
      if (!mounted.current) return;
      setPromos(result);
      setLoading(false);
    },
    [placement, limit, country]
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void load(false);
  }, [enabled, load]);

  const reload = useCallback(() => load(true), [load]);

  return { promos, loading, error, reload };
}
