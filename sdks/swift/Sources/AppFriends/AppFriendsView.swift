import SwiftUI

/// An inline promo unit you place directly in your layout.
///
/// It auto-fetches a promo for the placement on appear and renders it inline.
/// With no inventory (or on failure) it renders nothing — zero height — so you
/// can drop it into a list or stack without reserving space.
///
/// The default placement is ``AppFriendsPlacement/banner``, which renders a
/// compact horizontal strip. Pass ``AppFriendsPlacement/popup`` to render the
/// card style inline instead.
///
/// ```swift
/// VStack {
///     MyContent()
///     AppFriendsView()            // a banner, or nothing if no inventory
/// }
/// ```
public struct AppFriendsView: View {
    private let placement: AppFriendsPlacement
    private let accent: Color?

    @State private var promo: Promo?

    /// Creates an inline promo unit.
    ///
    /// - Parameters:
    ///   - placement: Which unit to render. Defaults to
    ///     ``AppFriendsPlacement/banner``.
    ///   - accent: Optional CTA accent override. Defaults to the brand violet.
    public init(
        placement: AppFriendsPlacement = .banner,
        accent: Color? = nil
    ) {
        self.placement = placement
        self.accent = accent
    }

    public var body: some View {
        Group {
            if let promo {
                content(for: promo)
            }
        }
        .task {
            guard promo == nil else { return }
            let promos = (try? await AppFriends.promotions(placement: placement, limit: 1)) ?? []
            promo = promos.first
        }
    }

    @ViewBuilder
    private func content(for promo: Promo) -> some View {
        let resolvedAccent = accent ?? AppFriendsTheme.violet
        switch placement {
        case .banner:
            AppFriendsBanner(promo: promo, accent: resolvedAccent)
        case .popup:
            // Render the card style inline (no dimmed backdrop, no dismiss).
            inlineCard(promo, accent: resolvedAccent)
        case .fullScreen:
            // A full-screen unit doesn't make sense inline; fall back to banner.
            AppFriendsBanner(promo: promo, accent: resolvedAccent)
        }
    }

    private func inlineCard(_ promo: Promo, accent: Color) -> some View {
        AppFriendsBanner(promo: promo, accent: accent)
    }
}

/// The compact inline banner row. Icon, name, subtitle, "Sponsored" tag, and a
/// "Get" CTA. Reports an impression on appear; on "Get" reports a tap and opens
/// the store.
struct AppFriendsBanner: View {
    let promo: Promo
    let accent: Color

    @Environment(\.openURL) private var openURL

    var body: some View {
        HStack(spacing: 12) {
            AppIcon(url: promo.iconURL, size: 48, cornerRadius: 11)

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(promo.appName)
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                    if promo.sponsored { SponsoredTag() }
                }
                if let subtitle = promo.displaySubtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer(minLength: 8)

            GetButton(title: promo.cta, accent: accent) { tapGet() }
        }
        .padding(12)
        .background(.background, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(Color.primary.opacity(0.08), lineWidth: 0.5)
        )
        .onAppear { AppFriends.reportImpression(promo) }
        .accessibilityElement(children: .combine)
    }

    private func tapGet() {
        AppFriends.reportTap(promo)
        if let url = promo.storeURL {
            openURL(url)
        }
    }
}
