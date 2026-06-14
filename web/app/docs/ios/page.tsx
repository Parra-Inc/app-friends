import { CodeBlock } from "@/components/docs/CodeBlock";

export const metadata = { title: "iOS SDK" };

export default function IosDocs() {
  return (
    <div className="prose-af">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
        iOS SDK
      </h1>
      <p>
        A SwiftUI package, iOS 16+, no third-party dependencies. It fetches promos,
        renders a popup or full-screen unit, opens the App Store on tap, and
        reports events.
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>iOS 16+ (the package also builds on macOS 13+ for previews and tests).</li>
        <li>Xcode 15 or newer · Swift 5.9+.</li>
        <li>No third-party dependencies.</li>
      </ul>

      <h2>Install with Swift Package Manager</h2>
      <p>
        <strong>In Xcode:</strong> File → Add Package Dependencies…, paste the
        repository URL, and add the <code>AppFriends</code> library to your app
        target.
      </p>
      <CodeBlock lang="Package URL" code={`https://github.com/Parra-Inc/app-friends`} />
      <p>
        While the SDK is in <strong>alpha</strong>, set the dependency rule to{" "}
        <strong>Exact Version</strong> → <code>0.1.0-alpha.0</code>. Swift Package
        Manager excludes pre-releases from version ranges, so{" "}
        <code>from:</code> / “Up to Next Major” won&apos;t pick up an alpha — pin
        it exactly. Once <code>1.0.0</code> ships you can switch to “Up to Next
        Major”.
      </p>

      <p>
        <strong>Or in <code>Package.swift</code></strong>, if your app is itself a
        package:
      </p>
      <CodeBlock
        lang="swift"
        code={`dependencies: [
  // Alpha — pin the exact pre-release:
  .package(url: "https://github.com/Parra-Inc/app-friends", exact: "0.1.0-alpha.0"),
  // Once 1.0 ships:
  // .package(url: "https://github.com/Parra-Inc/app-friends", from: "1.0.0"),
],
targets: [
  .target(name: "MyApp", dependencies: [
    .product(name: "AppFriends", package: "app-friends"),
  ]),
]`}
      />
      <p>
        The package manifest lives at the repository root, so this URL resolves
        directly in SPM — there&apos;s no separate distribution repo. Then{" "}
        <code>import AppFriends</code> where you need it.
      </p>

      <h2>Configure</h2>
      <p>
        Call <code>configure</code> once at launch. The bundle id defaults to your
        app&apos;s, so you usually only pass the key.
      </p>
      <CodeBlock
        lang="swift"
        code={`import AppFriends

@main
struct MyApp: App {
  init() {
    AppFriends.configure(apiKey: "afp_live_…")
  }
  var body: some Scene {
    WindowGroup { ContentView() }
  }
}`}
      />

      <h2>Show a popup</h2>
      <p>
        The simplest path is the view modifier. It fetches a promo, shows the
        card when one is available, reports the impression, and flips your binding
        back to <code>false</code> if there&apos;s no inventory.
      </p>
      <CodeBlock
        lang="swift"
        code={`struct ContentView: View {
  @State private var showPromo = false
  var body: some View {
    HomeView()
      .appFriendsPopup(isPresented: $showPromo)
      .task { showPromo = true }   // e.g. after a level, on app open, etc.
  }
}`}
      />

      <h2>Full-screen takeover</h2>
      <CodeBlock
        lang="swift"
        code={`HomeView()
  .appFriendsPopup(isPresented: $showPromo, placement: .fullScreen)`}
      />
      <p>
        Full-screen units honor a minimum interval between shows
        (configurable server-side). Check it yourself with{" "}
        <code>AppFriends.canShowFullScreen()</code> before triggering one.
      </p>

      <h2>Fetch manually</h2>
      <p>
        Want your own UI? Fetch the promos and report events yourself.
      </p>
      <CodeBlock
        lang="swift"
        code={`let promos = try await AppFriends.promotions(placement: .popup, limit: 5)
guard let promo = promos.first else { return }

AppFriends.reportImpression(promo)
// when the user taps "Get":
AppFriends.reportTap(promo)
if let url = URL(string: promo.storeUrl ?? "") {
  openURL(url)   // @Environment(\\.openURL)
}`}
      />

      <h2>Attribution</h2>
      <p>
        Each promo carries an opaque <code>token</code>. The SDK echoes it on tap
        and install events so the network can attribute results without any
        device identifiers. Report an install when you detect a new user came
        from a promo (e.g. after a successful first launch):
      </p>
      <CodeBlock lang="swift" code={`AppFriends.reportInstall(promo)`} />
      <p>
        Events are batched and sent fire-and-forget; call{" "}
        <code>AppFriends.flushEvents()</code> when your app backgrounds to flush
        anything pending.
      </p>

      <h2>Theming</h2>
      <p>
        The units use the App Friends brand by default. Override accents with{" "}
        <code>AppFriendsTheme</code> to match your app.
      </p>
    </div>
  );
}
