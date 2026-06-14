import SwiftUI

/// Overlays the popup or full-screen unit driven by a `Bool` binding.
///
/// On `isPresented == true` it fetches promos for the placement and shows the
/// first one. If there's no inventory (or the fetch fails), it renders nothing
/// and flips the binding back to `false`. For full-screen, it honors the
/// network's `minIntervalSeconds` and skips if shown too recently.
struct AppFriendsPopupModifier: ViewModifier {
    @Binding var isPresented: Bool
    let placement: AppFriendsPlacement
    let accent: Color?

    @State private var promo: Promo?
    @State private var loading = false

    func body(content: Content) -> some View {
        content
            .overlay {
                if let promo {
                    promoView(promo)
                        .transition(.opacity)
                }
            }
            .task(id: isPresented) {
                await handlePresentationChange()
            }
    }

    @ViewBuilder
    private func promoView(_ promo: Promo) -> some View {
        let resolvedAccent = accent ?? AppFriendsTheme.violet
        switch placement {
        case .fullScreen:
            AppFriendsFullScreenView(promo: promo, accent: resolvedAccent) { dismiss() }
        case .popup, .banner:
            AppFriendsPopupView(promo: promo, accent: resolvedAccent) { dismiss() }
        }
    }

    private func handlePresentationChange() async {
        guard isPresented else {
            promo = nil
            return
        }
        guard promo == nil, !loading else { return }

        if placement == .fullScreen, await !AppFriends.canShowFullScreen() {
            isPresented = false
            return
        }

        loading = true
        defer { loading = false }

        let promos = (try? await AppFriends.promotions(placement: placement, limit: 1)) ?? []
        guard let first = promos.first else {
            isPresented = false
            return
        }
        promo = first
    }

    private func dismiss() {
        promo = nil
        isPresented = false
    }
}

public extension View {
    /// Shows an App Friends promo over this view, driven by a `Bool` binding.
    ///
    /// When the binding turns `true`, the SDK fetches one promo for the
    /// placement and overlays the matching unit (a popup card, or a full-screen
    /// takeover for ``AppFriendsPlacement/fullScreen``). If there's no inventory
    /// or the fetch fails, nothing renders and the binding flips back to `false`.
    /// Full-screen respects the network's minimum interval between takeovers.
    ///
    /// ```swift
    /// struct ContentView: View {
    ///     @State private var showPromo = false
    ///     var body: some View {
    ///         MyHomeScreen()
    ///             .appFriendsPopup(isPresented: $showPromo)
    ///             .onAppear { showPromo = true }
    ///     }
    /// }
    /// ```
    ///
    /// - Parameters:
    ///   - isPresented: Controls presentation. The SDK sets it back to `false`
    ///     on dismiss or when there's no inventory.
    ///   - placement: ``AppFriendsPlacement/popup`` (default) or
    ///     ``AppFriendsPlacement/fullScreen``.
    ///   - accent: Optional CTA accent override. Defaults to the brand violet.
    func appFriendsPopup(
        isPresented: Binding<Bool>,
        placement: AppFriendsPlacement = .popup,
        accent: Color? = nil
    ) -> some View {
        modifier(AppFriendsPopupModifier(isPresented: isPresented, placement: placement, accent: accent))
    }
}
