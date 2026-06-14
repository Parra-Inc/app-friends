import { CodeBlock } from "@/components/docs/CodeBlock";

export const metadata = { title: "React Native SDK" };

export default function RnDocs() {
  return (
    <div className="prose-af">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
        React Native SDK
      </h1>
      <p>
        Drop-in components plus a hook. Works in bare React Native and Expo (no
        native module — it&apos;s pure JS + the <code>Linking</code> API).
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>React Native 0.68+ · React 17+.</li>
        <li>
          Pure JS — no native module, no config plugin. Works in bare React
          Native and Expo (managed or bare).
        </li>
      </ul>

      <h2>Install</h2>
      <p>
        The package is published to npm as <code>@parra/app-friends</code>.{" "}
        <code>react</code> and <code>react-native</code> are peer dependencies you
        already have.
      </p>
      <CodeBlock
        lang="bash"
        code={`# npm
npm install @parra/app-friends

# yarn
yarn add @parra/app-friends

# pnpm
pnpm add @parra/app-friends

# Expo
npx expo install @parra/app-friends`}
      />
      <p>
        While the SDK is in <strong>alpha</strong> it&apos;s published under the{" "}
        <code>alpha</code> dist-tag, so a bare install won&apos;t pick it up yet —
        request it explicitly:
      </p>
      <CodeBlock lang="bash" code={`npm install @parra/app-friends@alpha`} />

      <h2>Configure</h2>
      <p>
        Call <code>configure</code> once, where your app starts up (your{" "}
        <code>index.js</code> or root module). Pass your{" "}
        <strong>publishable</strong> key (it starts with <code>afp_</code>) and
        your app&apos;s bundle id — both are required.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { AppFriends } from "@parra/app-friends";

AppFriends.configure({
  apiKey: "afp_live_…",
  bundleId: "com.acme.notes",
  // baseURL: "https://appfriends.dev", // optional override (e.g. staging)
  // country: "US",                      // optional; the server infers it otherwise
});`}
      />

      <h2>Show a popup</h2>
      <CodeBlock
        lang="tsx"
        code={`import { useState } from "react";
import { AppFriendsPopup } from "@parra/app-friends";

export function Home() {
  const [show, setShow] = useState(false);
  return (
    <>
      {/* …your screen… */}
      <AppFriendsPopup visible={show} onClose={() => setShow(false)} />
    </>
  );
}`}
      />
      <p>
        The popup fetches a promo when it opens, reports the impression, and on
        &quot;Get&quot; reports a tap and opens the App Store. If there&apos;s no
        inventory it renders nothing.
      </p>

      <h2>Full-screen</h2>
      <CodeBlock
        lang="tsx"
        code={`import { AppFriendsFullScreen } from "@parra/app-friends";

<AppFriendsFullScreen visible={show} onClose={() => setShow(false)} />`}
      />

      <h2>The hook</h2>
      <p>Build your own UI with <code>useAppFriends</code>.</p>
      <CodeBlock
        lang="tsx"
        code={`import { useAppFriends, AppFriends } from "@parra/app-friends";

function Promos() {
  const { promos, loading, error, reload } = useAppFriends({ limit: 5 });
  if (loading || !promos.length) return null;
  const promo = promos[0];
  return (
    <Pressable onPress={() => AppFriends.reportTap(promo) /* then open store */}>
      <Text>{promo.headline ?? promo.appName}</Text>
    </Pressable>
  );
}`}
      />

      <h2>Attribution</h2>
      <p>
        Each promo has an opaque <code>token</code>; the SDK echoes it on tap and
        install. Report an install when a promo leads to one:
      </p>
      <CodeBlock lang="ts" code={`AppFriends.reportInstall(promo);`} />
      <p>
        Events are batched and flushed automatically. No device identifiers are
        collected.
      </p>

      <h2>Expo</h2>
      <p>
        Works in Expo Go and dev/production builds with no extra config — there&apos;s
        no native module to link.
      </p>
    </div>
  );
}
