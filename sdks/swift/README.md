# App Friends — Swift SDK

Show other developers' apps in yours, and get shown in theirs. App Friends is a
cross-promotion network: you trade installs with apps that aren't your
competition. This package fetches promos, renders them as a popup or full-screen
unit, opens the App Store on tap, and reports impressions, taps, and installs
back to the network.

- SwiftUI only. No third-party dependencies.
- iOS 16+ (also builds on macOS 13+ for tests and previews).
- Three lines to a working popup.

> **Runnable example:** [`Example/`](Example) — a SwiftUI app wired to this
> package and your local server. `cd Example && xcodegen generate && open
> AppFriendsExample.xcodeproj`. See [`Example/README.md`](Example/README.md).

## Install

### Swift Package Manager (Xcode)

1. File → Add Package Dependencies…
2. Enter the URL:

   ```
   https://github.com/Parra-Inc/app-friends
   ```

3. Set the dependency rule. While the SDK is in **alpha**, pin the exact
   prerelease (SPM excludes prereleases from version ranges):

   - Dependency Rule → **Exact Version** → `0.1.0-alpha.0`

   Once `1.0.0` ships you can switch to **Up to Next Major**.
4. Pick the `AppFriends` library and add it to your app target.

### Package.swift

```swift
dependencies: [
    // Alpha: pin the exact prerelease.
    .package(url: "https://github.com/Parra-Inc/app-friends", exact: "0.1.0-alpha.0"),
    // Once 1.0 ships:
    // .package(url: "https://github.com/Parra-Inc/app-friends", from: "1.0.0"),
],
targets: [
    .target(name: "MyApp", dependencies: [
        .product(name: "AppFriends", package: "app-friends"),
    ])
]
```

> The package manifest lives at the repo root, so this monorepo URL resolves
> directly in SPM — there's no separate distribution repo to track.

## Quick start

```swift
import AppFriends

AppFriends.configure(apiKey: "afp_live_xxx")   // once, at launch
// then anywhere in your view tree:
.appFriendsPopup(isPresented: $showPromo)      // shows one promo, or nothing
```

That's it. The modifier fetches a promo when `showPromo` turns `true`, springs
in a card, opens the store on "Get", and reports the impression and tap for you.
If there's no inventory it renders nothing and flips `showPromo` back to `false`.

## Configure

Call `configure` once, early — in your `App`'s initializer is a good spot.

```swift
import SwiftUI
import AppFriends

@main
struct MyApp: App {
    init() {
        AppFriends.configure(apiKey: "afp_live_xxx")
        // Optional:
        // AppFriends.configure(
        //     apiKey: "afp_live_xxx",
        //     bundleId: "com.example.myapp",      // defaults to Bundle.main.bundleIdentifier
        //     baseURL: URL(string: "https://appfriends.dev")  // override for staging
        // )
    }

    var body: some Scene {
        WindowGroup { ContentView() }
    }
}
```

| Option | Default | Notes |
| --- | --- | --- |
| `apiKey` | — | Your publishable key (`afp_…`). Safe to ship in the binary. |
| `bundleId` | `Bundle.main.bundleIdentifier` | The host app's bundle id. |
| `baseURL` | `https://appfriends.dev` | Point at staging if you need to. |
| `AppFriends.shared.country` | device region | ISO country sent with requests and events. |

## The popup modifier

```swift
struct HomeView: View {
    @State private var showPromo = false

    var body: some View {
        Feed()
            .appFriendsPopup(isPresented: $showPromo)
            .onAppear { showPromo = true }
    }
}
```

For a full-screen takeover, pass the placement. Full-screen honors the network's
minimum interval between takeovers, so calling it often is fine — it skips when
it's too soon.

```swift
.appFriendsPopup(isPresented: $showTakeover, placement: .fullScreen)
```

## Inline banner

`AppFriendsView` auto-fetches and renders inline. With no inventory it takes up
no space, so it's safe to drop into a stack or list.

```swift
VStack {
    MyContent()
    AppFriendsView()                 // a banner, or nothing
}
```

## Manual fetch

If you want to build your own UI, fetch promos yourself and report events as the
user interacts. The response is cached until the server's `expiresAt`, so repeat
calls within that window don't hit the network.

```swift
let promos = try await AppFriends.promotions(placement: .popup, limit: 5)

if let promo = promos.first {
    AppFriends.reportImpression(promo)   // when it becomes visible

    // when the user taps your "Get" button:
    AppFriends.reportTap(promo)
    if let url = promo.storeURL {
        await openURL(url)               // @Environment(\.openURL)
    }
}
```

You can also use the built-in views with your own promo:

```swift
AppFriendsPopupView(promo: promo) { /* dismissed */ }
AppFriendsFullScreenView(promo: promo) { /* dismissed */ }
```

## Events and attribution

Three event types: `impression`, `tap`, and `install`. Report them with
`AppFriends.reportImpression(_:)`, `reportTap(_:)`, and `reportInstall(_:)`.

- The built-in views report impressions and taps for you. You only call
  `reportInstall(_:)` yourself, if and when you confirm an install.
- Each promo carries an opaque `token`. The SDK echoes it back on tap and
  install so the network attributes the install to the right placement. Treat
  the token as a black box; don't construct or mutate it.
- Reporting is fire-and-forget. Calls return immediately, batch over a short
  debounce, and never throw back to you. Failed batches are re-queued.
- To flush queued events promptly — e.g. when the app backgrounds — call
  `AppFriends.flushEvents()`.

```swift
.onChange(of: scenePhase) { _, phase in
    if phase == .background { AppFriends.flushEvents() }
}
```

## Behavior with no network

Everything degrades to nothing. The fetch returns an empty array, the views
render nothing, the modifier flips its binding back to `false`, and event
reporting silently re-queues. Nothing crashes and nothing blocks your UI.

## Theming

The CTA uses the brand violet (`#6D4AFF`) by default. Override it per-view:

```swift
.appFriendsPopup(isPresented: $showPromo, accent: .indigo)
AppFriendsView(accent: Color(cssHex: "#FF6B5E"))
```

Built-in views honor Reduce Motion.
