import SwiftUI

/// A full-screen takeover promoting one app.
///
/// It shows a large icon, the headline, up to three screenshots in a horizontal
/// scroll, the rating, a big "Get" CTA, and a dismiss "X". It reports an
/// impression on appear, marks the full-screen pacing clock, and on "Get"
/// reports a tap and opens the store URL.
///
/// Present it with the
/// ``SwiftUI/View/appFriendsPopup(isPresented:placement:)`` modifier using
/// ``AppFriendsPlacement/fullScreen``, or construct it directly.
public struct AppFriendsFullScreenView: View {
    /// The promo to render.
    public let promo: Promo
    /// Optional accent override. Defaults to the brand violet.
    public var accent: Color
    /// Called when the takeover should go away.
    public var onDismiss: () -> Void

    @Environment(\.openURL) private var openURL
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown = false

    /// Creates a full-screen takeover.
    ///
    /// - Parameters:
    ///   - promo: The promo to show.
    ///   - accent: CTA accent color. Defaults to ``AppFriendsTheme/violet``.
    ///   - onDismiss: Called when the takeover should go away.
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
        ZStack(alignment: .top) {
            Color(.sRGB, white: 0.06)
                .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    header
                    screenshots
                    Spacer(minLength: 24)
                }
                .padding(.top, 64)
                .padding(.horizontal, 24)
                .padding(.bottom, 120)
            }

            footer
                .frame(maxHeight: .infinity, alignment: .bottom)
                .ignoresSafeArea(edges: .bottom)
        }
        .overlay(alignment: .topTrailing) {
            CloseButton { dismiss() }
                .padding(20)
        }
        .colorScheme(.dark)
        .opacity(shown ? 1 : 0)
        .offset(y: shown ? 0 : 24)
        .onAppear {
            AppFriends.reportImpression(promo)
            AppFriends.markFullScreenShown()
            if reduceMotion {
                shown = true
            } else {
                withAnimation(.spring(response: 0.42, dampingFraction: 0.86)) {
                    shown = true
                }
            }
        }
    }

    private var header: some View {
        VStack(spacing: 14) {
            AppIcon(url: promo.iconURL, size: 96, cornerRadius: 22)

            VStack(spacing: 6) {
                HStack(spacing: 8) {
                    Text(promo.appName)
                        .font(.title2.weight(.bold))
                        .multilineTextAlignment(.center)
                    if promo.sponsored { SponsoredTag() }
                }
                if let subtitle = promo.displaySubtitle {
                    Text(subtitle)
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                if let avg = promo.ratingAvg {
                    RatingView(average: avg, count: promo.ratingCount)
                        .padding(.top, 2)
                }
            }
        }
    }

    @ViewBuilder
    private var screenshots: some View {
        let urls = promo.screenshotURLs(limit: 3)
        if !urls.isEmpty {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(urls, id: \.self) { url in
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case .success(let image):
                                image.resizable().scaledToFit()
                            default:
                                RoundedRectangle(cornerRadius: 18)
                                    .fill(Color.white.opacity(0.06))
                            }
                        }
                        .frame(width: 200, height: 420)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                }
                .padding(.horizontal, 2)
            }
            .accessibilityHidden(true)
        }
    }

    private var footer: some View {
        VStack(spacing: 0) {
            Button(action: tapGet) {
                Text(promo.cta)
                    .font(.headline.weight(.bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .foregroundStyle(.white)
                    .background(accent, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 24)
            .padding(.top, 16)
            .padding(.bottom, 32)
        }
        .background(.ultraThinMaterial)
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
        withAnimation(.easeOut(duration: 0.22)) { shown = false }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.22) { onDismiss() }
    }
}
