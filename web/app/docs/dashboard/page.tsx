export const metadata = { title: "Dashboard guide" };

export default function DashboardDocs() {
  return (
    <div className="prose-af">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
        Dashboard guide
      </h1>
      <p>A tour of everything you can do in the App Friends dashboard.</p>

      <h2>Apps</h2>
      <p>
        Register the apps you want on the network. Import by bundle id (we pull
        public metadata) or add one manually. Each app has{" "}
        <strong>promo creative</strong> — the headline and subtitle other apps
        show when promoting yours — and participation toggles for view-for-view
        and sponsored placements. The <strong>category</strong> drives the overlap
        guard that keeps friends from being direct competitors.
      </p>

      <h2>API keys</h2>
      <p>
        Mint publishable keys (<code>afp_</code>) for your client SDKs and secret
        keys (<code>afs_</code>) for server-to-server calls. Keys are shown once;
        we store only a hash. Revoke any key instantly.
      </p>

      <h2>Network</h2>
      <ul>
        <li><strong>Friends</strong> — your active pairings and how balanced each exchange is.</li>
        <li><strong>Requests</strong> — accept or decline incoming pairing requests; track ones you&apos;ve sent.</li>
        <li><strong>Discover</strong> — browse non-competing apps and send pairing requests.</li>
        <li><strong>Advertisers</strong> — approve or block sponsored campaigns that want to run in your apps.</li>
      </ul>
      <p>
        The network keeps view-for-view fair: every impression updates a running
        balance, and when you&apos;ve shown a friend more than they&apos;ve shown
        you, the network favors showing their app to you until it evens out.
      </p>

      <h2>Campaigns (Pro)</h2>
      <p>
        Run sponsored placements to reach beyond your pairings. Pick an app, a
        pricing model (cost per install or per thousand views), a bid, a budget,
        and optional targeting by platform and category. Campaigns start as
        drafts; activate them once your wallet has credit. Every publisher must
        approve your campaign before it shows in their app.
      </p>

      <h2>Analytics</h2>
      <p>
        Views given and received, taps, installs, and earnings — for the whole
        workspace and per app, over the last 30 days.
      </p>

      <h2>Billing</h2>
      <p>
        Upgrade to Pro for unlimited apps and campaigns. Sponsored spend draws
        from a prepaid wallet you top up in any amount. The activity log shows
        every top-up and spend.
      </p>

      <h2>Settings</h2>
      <p>
        Rename your workspace, toggle auto-approval for advertisers, and manage
        your team — invite members as admins or members, change roles, and remove
        access.
      </p>
    </div>
  );
}
