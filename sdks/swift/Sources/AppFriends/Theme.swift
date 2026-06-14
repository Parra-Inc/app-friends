import SwiftUI

/// Brand colors and small style helpers used by the built-in views.
///
/// You don't need this unless you're building your own promo UI and want it to
/// match. The accent can be overridden per-view; see ``AppFriendsTheme/violet``.
public enum AppFriendsTheme {
    /// Brand violet, `#6D4AFF`. The primary CTA color.
    public static let violet = Color(hex: 0x6D4AFF)
    /// Coral accent, `#FF6B5E`. Used for the "Sponsored" tag.
    public static let coral = Color(hex: 0xFF6B5E)
    /// Rating star color.
    public static let star = Color(hex: 0xF5A623)

    static let cornerRadius: CGFloat = 20
}

extension Color {
    /// Builds a `Color` from a 24-bit RGB integer, e.g. `0x6D4AFF`.
    init(hex: UInt32, alpha: Double = 1) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }

    /// Builds a `Color` from a CSS-style hex string (`#6D4AFF`, `6D4AFF`, or
    /// `#RGB`). Returns `nil` for anything it can't parse.
    init?(cssHex: String) {
        var s = cssHex.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }
        if s.count == 3 {
            s = s.map { "\($0)\($0)" }.joined()
        }
        guard s.count == 6, let value = UInt32(s, radix: 16) else { return nil }
        self.init(hex: value)
    }
}
