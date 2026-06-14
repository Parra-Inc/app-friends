import { Linking } from "react-native";
import { AppFriends } from "./client";
import type { Promo } from "./contract";

/**
 * Report a tap for the given promo and open its App Store page.
 *
 * Reports the tap first (fire-and-forget — it never blocks or throws), then
 * hands the `storeUrl` to React Native's `Linking`. Resolves `true` once the
 * link is opened, `false` when the promo has no `storeUrl` or the open fails.
 *
 * @example
 * ```tsx
 * <Pressable onPress={() => openStore(promo)}>
 *   <Text>{promo.cta}</Text>
 * </Pressable>
 * ```
 */
export async function openStore(promo: Promo): Promise<boolean> {
  // Attribution first, so a tap is recorded even if the link open is slow.
  AppFriends.reportTap(promo);

  if (!promo.storeUrl) return false;

  try {
    await Linking.openURL(promo.storeUrl);
    return true;
  } catch {
    return false;
  }
}
