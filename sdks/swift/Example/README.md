# AppFriends iOS example

A minimal SwiftUI app that drops in the `AppFriends` SDK and shows promos from
your **local** App Friends server. It poses as the seeded `Nimbus Weather` app,
so the network returns its friends (Brightwords, Habit Garden) and never itself.

It exercises every entry point: the inline banner (`AppFriendsView`), the popup
and full-screen overlays (`.appFriendsPopup`), and a manual `AppFriends.promotions(…)`
fetch you render yourself.

## Run it

1. **Start the backend** and seed it (from the repo root):

   ```bash
   cd web && pnpm dev      # http://localhost:3053, seeds the sample tenant
   ```

2. **Generate the Xcode project** (needs [XcodeGen](https://github.com/yonsm/XcodeGen)):

   ```bash
   cd sdks/swift/Example
   xcodegen generate
   open AppFriendsExample.xcodeproj
   ```

3. **Run.** Pick an iOS Simulator and hit ▶. `http://localhost:3053` works from
   the Simulator out of the box.

### On a real device

`localhost` won't reach your Mac from a phone. Edit
[`Sources/DevConfig.swift`](Sources/DevConfig.swift) and set `baseURL` to your
Mac's LAN IP:

```bash
ipconfig getifaddr en0     # e.g. 192.168.1.20
```

```swift
static let baseURL = URL(string: "http://192.168.1.20:3053")!
```

Put the phone on the same Wi-Fi. The Info.plist already allows local-network
HTTP for development (`NSAllowsLocalNetworking`). Or expose the server over
HTTPS with a tunnel (e.g. ngrok) and point `baseURL` at that.

## What's here

| File | |
| --- | --- |
| `project.yml` | XcodeGen spec — links the local `AppFriends` package at `../`. |
| `Sources/AppFriendsExampleApp.swift` | `@main` app; calls `AppFriends.configure` at launch. |
| `Sources/ContentView.swift` | Banner, popup, full-screen, and manual-fetch demos. |
| `Sources/DevConfig.swift` | Key, bundle id, and base URL (all match the seed). |

The generated `AppFriendsExample.xcodeproj` is git-ignored — regenerate it with
`xcodegen generate`.
