import Link from "next/link";
import { CodeBlock } from "@/components/docs/CodeBlock";

export const metadata = { title: "Quickstart" };

export default function Quickstart() {
  return (
    <div className="prose-af">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
        Quickstart
      </h1>
      <p>From zero to your first traded install in about ten minutes.</p>

      <h2>1. Register an app</h2>
      <p>
        In the <Link href="/dashboard">dashboard</Link>, open <strong>Apps</strong>{" "}
        and paste your bundle id (or App Store id). We pull your icon,
        screenshots, rating, and category from the App Store automatically. You
        can also connect App Store Connect to import your whole catalog.
      </p>

      <h2>2. Create a publishable key</h2>
      <p>
        Under <strong>API keys</strong>, create a <strong>publishable</strong>{" "}
        key (it starts with <code>afp_</code>). Publishable keys are safe to ship
        inside your app — they can read promotions and report events, nothing
        else.
      </p>

      <h2>3. Install the SDK</h2>
      <p>
        iOS, via Swift Package Manager (Xcode → File → Add Package Dependencies…).
        During alpha, pin the exact version. See the{" "}
        <Link href="/docs/ios">iOS guide</Link> for the full steps.
      </p>
      <CodeBlock
        lang="Swift Package Manager"
        code={`https://github.com/Parra-Inc/app-friends
// Dependency Rule → Exact Version → 0.1.0-alpha.0`}
      />
      <p>
        React Native (npm). It&apos;s on the <code>alpha</code> dist-tag for now —
        see the <Link href="/docs/react-native">React Native guide</Link>:
      </p>
      <CodeBlock lang="bash" code={`npm install @parra/app-friends@alpha`} />

      <h2>4. Configure + show a promo</h2>
      <p>iOS:</p>
      <CodeBlock
        lang="swift"
        code={`import AppFriends

// once, at launch (e.g. in your App init)
AppFriends.configure(apiKey: "afp_live_…")

// anywhere in SwiftUI
struct ContentView: View {
  @State private var showPromo = true
  var body: some View {
    HomeView()
      .appFriendsPopup(isPresented: $showPromo)
  }
}`}
      />
      <p>React Native:</p>
      <CodeBlock
        lang="tsx"
        code={`import { AppFriends, AppFriendsPopup } from "@parra/app-friends";

// once, at launch
AppFriends.configure({ apiKey: "afp_live_…", bundleId: "com.acme.app" });

// anywhere in your tree
<AppFriendsPopup visible={show} onClose={() => setShow(false)} />`}
      />

      <h2>5. Find a friend</h2>
      <p>
        Open <strong>Network → Discover</strong>, pick the app you want to grow,
        and send a pairing request to an app that doesn&apos;t compete with
        yours. Once they accept, you&apos;ll start showing each other&apos;s
        promos — and the network keeps the exchange balanced.
      </p>

      <p>
        That&apos;s it. Impressions, taps, and installs flow back automatically;
        watch them in <strong>Analytics</strong>.
      </p>
    </div>
  );
}
