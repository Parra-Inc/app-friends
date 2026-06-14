import SwiftUI
import AppFriends

/// A tiny host app that exercises every way the SDK can show a promo:
/// the inline banner (`AppFriendsView`), the popup and full-screen overlays
/// (`.appFriendsPopup`), and a manual fetch you render yourself.
struct ContentView: View {
    @State private var showPopup = false
    @State private var showFullScreen = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text("This app poses as **Nimbus Weather**. The network returns its friends — Brightwords (sponsored) and Habit Garden (pairing) — never itself.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section("Overlays") {
                    Button("Show popup") { showPopup = true }
                    Button("Show full-screen takeover") { showFullScreen = true }
                }

                Section("Inline banner (AppFriendsView)") {
                    // Renders a banner if there's inventory, or nothing at all.
                    AppFriendsView()
                        .listRowInsets(EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12))
                }

                Section("Manual fetch") {
                    ManualPromoList()
                }
            }
            .navigationTitle("App Friends")
        }
        // Driven by Bool bindings; the SDK flips them back to false on dismiss
        // or when there's no inventory.
        .appFriendsPopup(isPresented: $showPopup)
        .appFriendsPopup(isPresented: $showFullScreen, placement: .fullScreen)
    }
}

/// Fetches promos directly and renders them with your own UI, reporting events
/// as the user interacts — the "build your own unit" path.
private struct ManualPromoList: View {
    @State private var promos: [Promo] = []
    @State private var loading = true
    @Environment(\.openURL) private var openURL

    var body: some View {
        Group {
            if loading {
                HStack { ProgressView(); Text("Loading…").foregroundStyle(.secondary) }
            } else if promos.isEmpty {
                Text("No inventory. Is the web app running and seeded?")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(promos, id: \.id) { promo in
                    row(for: promo)
                }
            }
        }
        .task { await load() }
    }

    private func row(for promo: Promo) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(promo.appName).font(.subheadline.weight(.semibold))
                    if promo.sponsored {
                        Text("SPONSORED")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(.secondary)
                    }
                }
                if let subtitle = promo.displaySubtitle {
                    Text(subtitle).font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            Button(promo.cta) { get(promo) }
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
        }
        .onAppear { AppFriends.reportImpression(promo) }
    }

    private func get(_ promo: Promo) {
        AppFriends.reportTap(promo)
        if let url = promo.storeURL { openURL(url) }
    }

    private func load() async {
        loading = true
        promos = (try? await AppFriends.promotions(placement: .popup, limit: 5)) ?? []
        loading = false
    }
}

#Preview {
    ContentView()
}
