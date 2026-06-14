import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { AppFriends } from "../client";
import type { Placement, Promo } from "../contract";
import { openStore } from "../openStore";
import { formatRating, formatRatingCount, resolveTheme } from "../theme";

/** Props for {@link AppFriendsFullScreen}. */
export interface AppFriendsFullScreenProps {
  /** Whether the takeover is shown. */
  visible: boolean;
  /** Called when the user dismisses, or when there's no inventory to show. */
  onClose: () => void;
  /** Placement to request. Defaults to `FULLSCREEN`. */
  placement?: Placement;
  /** Maximum promos to fetch (the takeover shows the first). Defaults to 1. */
  limit?: number;
  /** Optional bundle id override. See {@link AppFriendsPopup}. */
  bundleId?: string;
  /** Override the CTA / accent color (e.g. from your remote `SdkConfig`). */
  accentColor?: string | null;
  /** Called after the user taps the CTA and the store opens. */
  onGet?: (promo: Promo) => void;
}

const SHOT_HEIGHT = Math.min(Math.round(Dimensions.get("window").height * 0.42), 420);
const SHOT_WIDTH = Math.round(SHOT_HEIGHT * 0.46);

/**
 * A full-screen promo takeover with a screenshot gallery and a large CTA.
 *
 * Fetches one promo on open, reports an impression when it appears, scrolls the
 * promo's screenshots horizontally, and on the CTA reports a tap and opens the
 * App Store. Renders nothing (and calls `onClose`) when there's no inventory.
 *
 * @example
 * ```tsx
 * <AppFriendsFullScreen visible={open} onClose={() => setOpen(false)} />
 * ```
 */
export function AppFriendsFullScreen(
  props: AppFriendsFullScreenProps
): React.ReactElement | null {
  const { visible, onClose, placement = "FULLSCREEN", limit = 1, accentColor, onGet } = props;

  const scheme = useColorScheme();
  const theme = resolveTheme(scheme, accentColor);

  const [promo, setPromo] = useState<Promo | null>(null);
  const [loading, setLoading] = useState(false);
  const [impressionToken, setImpressionToken] = useState<string | null>(null);

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
        if (!first) onClose();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, placement, limit]);

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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: theme.card }]}>
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
            <ActivityIndicator color={theme.accent} size="large" />
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                {promo.iconUrl ? (
                  <Image source={{ uri: promo.iconUrl }} style={styles.icon} />
                ) : (
                  <View style={[styles.icon, { backgroundColor: theme.fill }]} />
                )}
                <View style={styles.headerText}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.appName, { color: theme.text }]} numberOfLines={2}>
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
                    <Text
                      style={[styles.category, { color: theme.textMuted }]}
                      numberOfLines={1}
                    >
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
                <Text style={[styles.headline, { color: theme.text }]}>{body}</Text>
              ) : null}

              {promo.screenshots.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.shots}
                  contentContainerStyle={styles.shotsContent}
                >
                  {promo.screenshots.map((uri, i) => (
                    <Image
                      key={`${uri}:${i}`}
                      source={{ uri }}
                      style={[styles.shot, { backgroundColor: theme.fill }]}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              ) : null}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
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
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 56,
  },
  close: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 2,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 18,
    fontWeight: "600",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 32,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 20,
  },
  headerText: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  appName: {
    flexShrink: 1,
    fontSize: 24,
    fontWeight: "800",
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
    marginTop: 4,
    fontSize: 14,
  },
  rating: {
    marginTop: 6,
    fontSize: 14,
  },
  headline: {
    marginTop: 24,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "500",
  },
  shots: {
    marginTop: 24,
  },
  shotsContent: {
    paddingRight: 24,
  },
  shot: {
    width: SHOT_WIDTH,
    height: SHOT_HEIGHT,
    borderRadius: 18,
    marginRight: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cta: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 18,
    fontWeight: "800",
  },
});
