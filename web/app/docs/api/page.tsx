import { CodeBlock, Endpoint } from "@/components/docs/CodeBlock";

export const metadata = { title: "API reference" };

export default function ApiDocs() {
  return (
    <div className="prose-af">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
        API reference
      </h1>
      <p>
        The SDKs wrap these three endpoints. You can call them directly for
        platforms we don&apos;t have an SDK for yet. Base URL:{" "}
        <code>https://appfriends.dev</code>. All responses are JSON.
      </p>

      <h2>Authentication</h2>
      <p>
        Pass an API key on every request, either as a bearer token or a header:
      </p>
      <CodeBlock
        lang="http"
        code={`Authorization: Bearer afp_live_…
# or
X-AppFriends-Key: afp_live_…`}
      />
      <p>
        Publishable keys (<code>afp_</code>) can read promotions and post events.
        Secret keys (<code>afs_</code>) can do everything. Ship only publishable
        keys in client apps.
      </p>

      <h2>Get promotions</h2>
      <Endpoint method="GET" path="/api/v1/sdk/promotions" />
      <p>Query parameters:</p>
      <ul>
        <li><code>bundleId</code> (required) — the host app asking for promos.</li>
        <li><code>placement</code> — <code>POPUP</code> | <code>FULLSCREEN</code> | <code>BANNER</code>. Default <code>POPUP</code>.</li>
        <li><code>limit</code> — max promos to return (1–10).</li>
        <li><code>country</code> — optional ISO-3166 country code.</li>
      </ul>
      <CodeBlock
        lang="json"
        code={`{
  "promos": [
    {
      "id": "app_…",
      "token": "eyJhbGci…",
      "source": "PAIRING",
      "placement": "POPUP",
      "appName": "Nimbus Weather",
      "subtitle": "The forecast, finally calm",
      "headline": "Weather without the noise",
      "iconUrl": "https://…/icon.png",
      "screenshots": ["https://…/1.png"],
      "storeUrl": "https://apps.apple.com/app/id…",
      "category": "Weather",
      "ratingAvg": 4.8,
      "ratingCount": 1203,
      "cta": "Get",
      "sponsored": false
    }
  ],
  "servedAt": "2026-06-07T12:00:00.000Z",
  "expiresAt": "2026-06-07T12:05:00.000Z",
  "placement": "POPUP"
}`}
      />
      <p>
        The response never includes the caller&apos;s own app or another app in
        the caller&apos;s workspace. Cache it until <code>expiresAt</code>.
      </p>

      <h2>Report events</h2>
      <Endpoint method="POST" path="/api/v1/sdk/events" />
      <p>
        Send a batch of events. Echo the <code>token</code> from the promo. Each
        token+type pair is recorded once, so retries are safe.
      </p>
      <CodeBlock
        lang="json"
        code={`{
  "events": [
    { "token": "eyJhbGci…", "type": "impression" },
    { "token": "eyJhbGci…", "type": "tap", "country": "US" },
    { "token": "eyJhbGci…", "type": "install" }
  ]
}`}
      />
      <p>Response:</p>
      <CodeBlock lang="json" code={`{ "accepted": 3 }`} />

      <h2>Get config</h2>
      <Endpoint method="GET" path="/api/v1/sdk/config" />
      <p>
        Optional <code>bundleId</code> query. Returns remote settings so behavior
        can be tuned without an app update.
      </p>
      <CodeBlock
        lang="json"
        code={`{
  "enabled": true,
  "cacheSeconds": 300,
  "minIntervalSeconds": 120,
  "defaultPlacement": "POPUP",
  "accentColor": null
}`}
      />

      <h2>Errors</h2>
      <p>
        Errors return a JSON body <code>{`{ code, message, cause? }`}</code> with an
        appropriate status: <code>401</code> (bad key), <code>404</code> (unknown
        bundle id), <code>429</code> (rate limited), <code>400</code> (bad
        request).
      </p>
    </div>
  );
}
