import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { AppFriends } from "../client";
import type { Placement, Promo } from "../contract";
import { openStore } from "../openStore";
import { formatRating, formatRatingCount, resolveTheme } from "../theme";

/** Props for {@link AppFriendsPopup}. */
export interface AppFriendsPopupProps {
  /** Whether the popup is shown. */
  visible: boolean;
  /** Called when the user dismisses, or when there's no inventory to show. */
  onClose: () => void;
  /** Placement to request. Defaults to `POPUP`. */
  placement?: Placement;
  /** Maximum promos to fetch (the popup shows the first). Defaults to 1. */
  limit?: number;
  /**
   * Optional bundle id override. Normally the SDK uses the bundle id from
   * {@link AppFriends.configure}; this is here for parity with the contract and
   * advanced multi-app setups.
   */
  bundleId?: string;
  /** Override the CTA / accent color (e.g. from your remote `SdkConfig`). */
  accentColor?: string | null;
  /** Called after the user taps "Get" and the store opens. */
  onGet?: (promo: Promo) => void;
}

/**
 * A compact promo card shown in a centered modal.
 *
 * On open it fetches one promo, reports an impression when it appears, and on
 * "Get" reports a tap and opens the App Store. Renders nothing (and calls
 * `onClose`) when the network has no inventory.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * <AppFriendsPopup visible={open} onClose={() => setOpen(false)} />
 * ```
 */
export function AppFriendsPopup(props: AppFriendsPopupProps): React.ReactElement | null {
  const { visible, onClose, placement = "POPUP", limit = 1, accentColor, onGet } = props;

  const scheme = useColorScheme();
  const theme = resolveTheme(scheme, accentColor);

  const [promo, setPromo] = useState<Promo | null>(null);
  const [loading, setLoading] = useState(false);
  const [impressionToken, setImpressionToken] = useState<string | null>(null);

  // Fetch a promo each time the popup becomes visible.
  useEffect(() => {
    if (!visible) {
      setPromo(null);
      setImpressionToken(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    AppFriends.fetchPromotions({ placement, limit })
      .then((promos) => {
        if (cancelled) return;
        const first = promos[0] ?? null;
        setPromo(first);
        setLoading(false);
        if (!first) onClose(); // No inventory — don't show an empty sheet.
      })
      .catch(() => {
        if (cancelled) return;
        setPromo(null);
        setLoading(false);
        onClose();
      });

    return () => {
      cancelled = true;
    };
    // onClose is intentionally excluded to avoid re-fetching on parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, placement, limit]);

  // Report an impression once per shown promo.
  useEffect(() => {
    if (visible && promo && promo.token !== impressionToken) {
      AppFriends.reportImpression(promo);
      setImpressionToken(promo.token);
    }
  }, [visible, promo, impressionToken]);

  if (!visible) return null;

  const handleGet = async () => {
    if (!promo) return;
    await openStore(promo);
    onGet?.(promo);
    onClose();
  };

  const rating = promo ? formatRating(promo.ratingAvg) : null;
  const ratingCount = promo ? formatRatingCount(promo.ratingCount) : null;
  const body = promo ? promo.headline || promo.subtitle : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { backgroundColor: theme.scrim }]} onPress={onClose}>
        {/* Stop taps inside the card from dismissing. */}
        <Pressable style={[styles.card, { backgroundColor: theme.card }]} onPress={() => {}}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            hitSlop={12}
            style={styles.close}
          >
            <Text style={[styles.closeText, { color: theme.textMuted }]}>✕</Text>
          </Pressable>

          {loading || !promo ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : (
            <>
              <View style={styles.header}>
                {promo.iconUrl ? (
                  <Image source={{ uri: promo.iconUrl }} style={styles.icon} />
                ) : (
                  <View style={[styles.icon, { backgroundColor: theme.fill }]} />
                )}
                <View style={styles.headerText}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.appName, { color: theme.text }]} numberOfLines={1}>
                      {promo.appName}
                    </Text>
                    {promo.sponsored ? (
                      <View style={[styles.pill, { borderColor: theme.border }]}>
                        <Text style={[styles.pillText, { color: theme.textMuted }]}>
                          Sponsored
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {promo.category ? (
                    <Text style={[styles.category, { color: theme.textMuted }]} numberOfLines={1}>
                      {promo.category}
                    </Text>
                  ) : null}
                  {rating ? (
                    <Text style={[styles.rating, { color: theme.textMuted }]}>
                      ★ {rating}
                      {ratingCount ? `  ·  ${ratingCount} ratings` : ""}
                    </Text>
                  ) : null}
                </View>
              </View>

              {body ? (
                <Text style={[styles.body, { color: theme.text }]} numberOfLines={3}>
                  {body}
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={promo.cta || "Get"}
                onPress={handleGet}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.cta,
                  { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={[styles.ctaText, { color: theme.onAccent }]}>
                  {promo.cta || "Get"}
                </Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  close: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loading: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 24,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  headerText: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  appName: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  pill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  category: {
    marginTop: 2,
    fontSize: 13,
  },
  rating: {
    marginTop: 4,
    fontSize: 13,
  },
  body: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 21,
  },
  cta: {
    marginTop: 20,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
