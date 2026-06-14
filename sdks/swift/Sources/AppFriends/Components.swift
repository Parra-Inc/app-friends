import SwiftUI

/// A "Sponsored" disclosure tag. The built-in views show this automatically for
/// paid placements; you don't normally place it yourself.
struct SponsoredTag: View {
    var body: some View {
        Text("Sponsored")
            .font(.caption2.weight(.semibold))
            .textCase(.uppercase)
            .tracking(0.4)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .foregroundStyle(AppFriendsTheme.coral)
            .background(AppFriendsTheme.coral.opacity(0.12), in: Capsule())
            .accessibilityLabel("Sponsored")
    }
}

/// A compact rating row: a star, the average, and the count in parens.
struct RatingView: View {
    let average: Double
    let count: Int?

    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: "star.fill")
                .font(.caption2)
                .foregroundStyle(AppFriendsTheme.star)
            Text(String(format: "%.1f", average))
                .font(.caption.weight(.medium))
            if let count, count > 0 {
                Text("(\(count.formatted(.number.notation(.compactName))))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityLabel)
    }

    private var accessibilityLabel: String {
        if let count, count > 0 {
            return "Rated \(String(format: "%.1f", average)) out of 5, \(count) ratings"
        }
        return "Rated \(String(format: "%.1f", average)) out of 5"
    }
}

/// The app icon with a placeholder while it loads. Uses `AsyncImage`, so it
/// works the same on iOS and macOS.
struct AppIcon: View {
    let url: URL?
    var size: CGFloat = 64
    var cornerRadius: CGFloat = 14

    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .success(let image):
                image.resizable().scaledToFill()
            default:
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(AppFriendsTheme.violet.opacity(0.12))
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .strokeBorder(Color.primary.opacity(0.06), lineWidth: 0.5)
        )
        .accessibilityHidden(true)
    }
}

/// The pill "Get" CTA used by both built-in views.
struct GetButton: View {
    let title: String
    let accent: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.weight(.bold))
                .padding(.horizontal, 22)
                .padding(.vertical, 8)
                .foregroundStyle(.white)
                .background(accent, in: Capsule())
        }
        .buttonStyle(.plain)
    }
}
