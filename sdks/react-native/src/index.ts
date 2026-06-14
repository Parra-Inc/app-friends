/**
 * `@parra/app-friends` — the App Friends React Native SDK.
 *
 * App Friends is a cross-promotion network for app developers. Configure the
 * SDK with your publishable key and bundle id, then drop in a popup or
 * full-screen takeover to show other apps and earn views back.
 *
 * @example
 * ```ts
 * import { AppFriends, AppFriendsPopup } from "@parra/app-friends";
 *
 * AppFriends.configure({ apiKey: "afp_live_xxx", bundleId: "com.acme.notes" });
 * ```
 */

// Client + configuration.
export {
  AppFriends,
  flushEvents,
  type AppFriendsOptions,
  type FetchPromotionsArgs,
} from "./client";

// Store-opening helper.
export { openStore } from "./openStore";

// Theming.
export { BRAND, resolveTheme, formatRating, formatRatingCount, type Theme } from "./theme";

// Components.
export {
  AppFriendsPopup,
  type AppFriendsPopupProps,
} from "./components/AppFriendsPopup";
export {
  AppFriendsFullScreen,
  type AppFriendsFullScreenProps,
} from "./components/AppFriendsFullScreen";

// Hook.
export {
  useAppFriends,
  type UseAppFriendsArgs,
  type UseAppFriendsResult,
} from "./hooks/useAppFriends";

// Contract types.
export {
  SDK_DEFAULTS,
  type Placement,
  type PromoSourceWire,
  type EventType,
  type Promo,
  type PromotionsResponse,
  type EventInput,
  type EventsRequest,
  type EventsResponse,
  type SdkConfig,
} from "./contract";
