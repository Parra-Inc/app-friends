# @parra/app-friends

The React Native SDK for [App Friends](https://appfriends.dev) — a cross-promotion
network for app developers. Show other apps in your app, get shown in theirs.

The SDK fetches promos from the network, renders them as a popup or a full-screen
takeover, opens the App Store on tap, and reports impression / tap / install
events back for attribution. It never throws into your app: network failures
resolve to empty inventory and analytics is fire-and-forget.

> **Runnable example:** [`example/`](example) — an Expo app wired to this SDK and
> your local server. `cd example && npm install && npx expo start`. See
> [`example/README.md`](example/README.md).

## Install

```sh
npm i @parra/app-friends
# or
yarn add @parra/app-friends
```

`react` and `react-native` are peer dependencies — you already have them.

## Configure

Call `configure` once, early — your `index.js` or root module is a good spot.
Use your **publishable** key (it looks like `afp_…`) and your app's bundle id.

```ts
import { AppFriends } from "@parra/app-friends";

AppFriends.configure({
  apiKey: "afp_live_xxxxxxxx",
  bundleId: "com.acme.notes",
  // baseURL: "https://appfriends.dev", // optional override
  // country: "US",                      // optional; the server infers it otherwise
});
```

## Popup

A compact card in a centered modal. It fetches one promo when it opens, reports
an impression when it shows, and on **Get** reports a tap and opens the store. If
there's no inventory it renders nothing and calls `onClose`.

```tsx
import { useState } from "react";
import { Button } from "react-native";
import { AppFriendsPopup } from "@parra/app-friends";

function Example() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button title="Show a friend" onPress={() => setOpen(true)} />
      <AppFriendsPopup visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

## Full-screen takeover

Same lifecycle as the popup, with a screenshot gallery and a big CTA. Good for
natural breakpoints — finishing a task, a level, an export.

```tsx
import { AppFriendsFullScreen } from "@parra/app-friends";

<AppFriendsFullScreen visible={open} onClose={() => setOpen(false)} />;
```

## `useAppFriends` hook

Roll your own UI. The hook returns inventory plus loading / error state and a
`reload` that bypasses the cache. Pair it with `openStore` to handle taps.

```tsx
import { useAppFriends, openStore } from "@parra/app-friends";
import { Image, Pressable, Text, View } from "react-native";

function MyPromoStrip() {
  const { promos, loading, reload } = useAppFriends({ placement: "POPUP", limit: 5 });

  if (loading || promos.length === 0) return null;

  return (
    <View>
      {promos.map((promo) => (
        <Pressable key={promo.id} onPress={() => openStore(promo)}>
          {promo.iconUrl ? <Image source={{ uri: promo.iconUrl }} /> : null}
          <Text>{promo.appName}</Text>
          <Text>{promo.headline ?? promo.subtitle}</Text>
        </Pressable>
      ))}
    </View>
  );
}
```

When you render promos yourself, report impressions so you get views back:

```ts
import { AppFriends } from "@parra/app-friends";

AppFriends.reportImpression(promo); // when a promo becomes visible
// openStore(promo) already reports the tap for you
```

## Configuration & caching

- **Caching.** Promotions are cached in memory per placement/limit/country until
  the server's `expiresAt`. Call `AppFriends.clearCache()` or a hook's `reload()`
  to force a fresh fetch.
- **Remote config.** `AppFriends.fetchConfig()` returns `{ enabled, cacheSeconds,
  minIntervalSeconds, defaultPlacement, accentColor }`. Use `enabled` to skip
  showing anything when there's no inventory, and `accentColor` to match your
  brand (pass it to a component's `accentColor` prop).
- **Placements.** `POPUP`, `FULLSCREEN`, `BANNER`. The components default to the
  obvious one; the hook defaults to the remote config's `defaultPlacement`.

## Attribution & events

The SDK reports three event types, each carrying the promo's opaque `token`:

- **impression** — when a promo is shown.
- **tap** — when the user taps through (`openStore` does this for you).
- **install** — call `AppFriends.reportInstall(promo)` if you can confirm an
  install (e.g. via a deep link or post-install handoff).

Events are batched and debounced, then sent fire-and-forget. To flush early
(for example when the app backgrounds), call `AppFriends.flush()`.

## Theming

Components respect the system color scheme via `useColorScheme()` and use the App
Friends brand colors — violet `#6D4AFF` and coral `#FF6B5E` — by default. Override
the accent per component with the `accentColor` prop, or import the palette:

```ts
import { BRAND, resolveTheme } from "@parra/app-friends";
```

## Expo compatibility

Works with Expo (managed and bare). The SDK only uses standard React Native APIs
(`View`, `Text`, `Image`, `Modal`, `Pressable`, `ScrollView`, `Linking`, …) and
`fetch`, so there's no native module to link and no config plugin to add. Drop it
into an Expo Go session or a development build and it runs.

## License

MIT
