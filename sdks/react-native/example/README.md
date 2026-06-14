# App Friends React Native example

A minimal Expo app that drops in `@parra/app-friends` and shows promos
from your **local** App Friends server. It poses as the seeded `Nimbus Weather`
app, so the network returns its friends (Brightwords, Habit Garden) and never
itself.

It exercises the popup (`AppFriendsPopup`), the full-screen takeover
(`AppFriendsFullScreen`), and the `useAppFriends()` hook rendered with your own
UI.

## Run it

1. **Start the backend** and seed it (from the repo root):

   ```bash
   cd web && pnpm dev      # http://localhost:3050, seeds the sample tenant
   ```

2. **Install and start Expo** (from here):

   ```bash
   cd sdks/react-native/example
   npm install
   npx expo start
   ```

3. **Open it.** Press `i` for the iOS Simulator, or scan the QR code with
   [Expo Go](https://expo.dev/go) on your phone. The base URL is derived from
   Expo's host automatically — the Simulator uses `localhost`, and a real device
   uses your Mac's LAN IP (make sure the phone is on the same Wi-Fi).

## How it's wired

- [`App.tsx`](App.tsx) calls `AppFriends.configure({ apiKey, bundleId, baseURL })`
  once at module load. `apiKey` is the stable key from the seed; `baseURL` is
  derived from Expo's host (see `devBaseURL`).
- [`metro.config.js`](metro.config.js) resolves `@parra/app-friends`
  straight from the SDK's `../src`, so editing the SDK reloads the example — and
  pins React / React Native to this app's copies (avoids the "two Reacts" trap).

No build step for the SDK is needed; Metro transpiles its TypeScript source
directly.
