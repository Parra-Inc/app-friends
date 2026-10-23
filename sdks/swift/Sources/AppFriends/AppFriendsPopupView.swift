import SwiftUI

/// A card popup promoting one app.
///
/// It shows the app icon, name, headline or subtitle, a "Sponsored" tag when the
/// promo is paid, the rating, a "Get" CTA, and a close button. It springs in
/// (scale + fade), reports an impression on appear, and on "Get" reports a tap
/// and opens the store URL.
///
/// You usually present this with the
/// ``SwiftUI/View/appFriendsPopup(isPresented:placement:)`` modifier rather than
/// constructing it directly, but it's public if you want to place it yourself.
///
/// ```swift
/// AppFriendsPopupView(promo: promo) { dismiss() }
/// ```
public struct AppFriendsPopupView: View {
    /// The promo to render.
    public let promo: Promo
    /// Optional accent override. Defaults to the brand violet.
    public var accent: Color
    /// Called when the user closes the card or finishes tapping through.
    public var onDismiss: () -> Void

    @Environment(\.openURL) private var openURL
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AccessibilityFocusState private var ctaFocused: Bool
    @State private var shown = false

    /// Creates a popup card.
    ///
    /// - Parameters:
    ///   - promo: The promo to show.
    ///   - accent: CTA accent color. Defaults to ``AppFriendsTheme/violet``.
    ///   - onDismiss: Called when the card should go away.
    public init(
        promo: Promo,
        accent: Color = AppFriendsTheme.violet,
        onDismiss: @escaping () -> Void
    ) {
        self.promo = promo
        self.accent = accent
        self.onDismiss = onDismiss
    }

    public var body: some View {
        ZStack {
            Color.black.opacity(shown ? 0.35 : 0)
                .ignoresSafeArea()
                .onTapGesture { dismiss() }
                .accessibilityHidden(true)

            card
                .padding(24)
                .scaleEffect(shown ? 1 : 0.96)
                .opacity(shown ? 1 : 0)
        }
        .accessibilityAddTraits(.isModal)
        .accessibilityAction(.escape) { dismiss() }
        .onAppear {
            AppFriends.reportImpression(promo)
            if reduceMotion {
                shown = true
            } else {
                withAnimation(.spring(response: 0.38, dampingFraction: 0.78)) {
                    shown = true
                }
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { ctaFocused = true }
        }
    }

    private var card: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 14) {
                AppIcon(url: promo.iconURL, size: 64)

                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(promo.appName)
                            .font(.headline)
                            .lineLimit(1)
                            .accessibilityAddTraits(.isHeader)
                        if promo.sponsored { SponsoredTag() }
                    }
                    if let subtitle = promo.displaySubtitle {
                        Text(subtitle)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }
                    if let avg = promo.ratingAvg {
                        RatingView(average: avg, count: promo.ratingCount)
                            .padding(.top, 2)
                    }
                }
                .accessibilityElement(children: .combine)
                Spacer(minLength: 0)
            }

            HStack {
                if let category = promo.category {
                    Text(category)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                GetButton(title: promo.cta, accent: accent) { tapGet() }
                    .accessibilityFocused($ctaFocused)
            }
        }
        .padding(20)
        .background(.background, in: RoundedRectangle(cornerRadius: AppFriendsTheme.cornerRadius, style: .continuous))
        .overlay(alignment: .topTrailing) {
            CloseButton { dismiss() }
                .padding(8)
        }
        .shadow(color: .black.opacity(0.18), radius: 24, y: 12)
        .frame(maxWidth: 380)
    }

    private func tapGet() {
        AppFriends.reportTap(promo)
        if let url = promo.storeURL {
            openURL(url)
        }
        dismiss()
    }

    private func dismiss() {
        if reduceMotion {
            onDismiss()
            return
        }
        withAnimation(.easeOut(duration: 0.2)) { shown = false }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { onDismiss() }
    }
}

/// The small circular "X" close control shared by the built-in views.
struct CloseButton: View {
    let action: () -> Void

    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @ScaledMetric(relativeTo: .footnote) private var glyphSize: CGFloat = 11

    var body: some View {
        Button(action: action) {
            Image(systemName: "xmark")
                .font(.system(size: glyphSize, weight: .bold))
                .foregroundStyle(.secondary)
                .padding(7)
                .background {
                    if reduceTransparency {
                        Circle().fill(Color.gray.opacity(0.3)).background(Circle().fill(.background))
                    } else {
                        Circle().fill(.thinMaterial)
                    }
                }
                .frame(minWidth: 44, minHeight: 44)
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Close")
    }
}
