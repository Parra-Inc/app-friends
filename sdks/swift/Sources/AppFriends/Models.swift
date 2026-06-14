import Foundation

/// Where a promo is shown. Maps to the wire strings the App Friends API uses.
///
/// - ``popup``: a card that springs in over your content.
/// - ``fullScreen``: a full-screen takeover with screenshots.
/// - ``banner``: an inline strip you place in your own layout.
public enum AppFriendsPlacement: String, Codable, Sendable, CaseIterable {
    case popup
    case fullScreen
    case banner

    /// The string the API expects (`POPUP`, `FULLSCREEN`, `BANNER`).
    public var wireValue: String {
        switch self {
        case .popup: return "POPUP"
        case .fullScreen: return "FULLSCREEN"
        case .banner: return "BANNER"
        }
    }

    /// Builds a placement from an API wire string. Returns `nil` for anything
    /// the SDK doesn't recognize.
    public init?(wireValue: String) {
        switch wireValue.uppercased() {
        case "POPUP": self = .popup
        case "FULLSCREEN": self = .fullScreen
        case "BANNER": self = .banner
        default: return nil
        }
    }
}

/// Where a promo came from. `PAIRING` is the free, reciprocal product;
/// `CAMPAIGN` is a paid placement.
public enum AppFriendsPromoSource: String, Codable, Sendable {
    case pairing = "PAIRING"
    case campaign = "CAMPAIGN"
}

/// A single app to show the user.
///
/// You normally don't build these yourself; the SDK fetches them from the
/// network. The one field you should treat as opaque is ``token`` — the SDK
/// echoes it back on tap and install events so the network can attribute
/// installs to the right placement.
public struct Promo: Codable, Sendable, Identifiable, Equatable {
    /// Stable id of this promo card (the promoted app's id).
    public let id: String

    /// Opaque attribution token. Echoed back on tap/install events. Treat as
    /// a black box.
    public let token: String

    /// Whether this came from a pairing (free) or a campaign (paid).
    public let source: AppFriendsPromoSource

    /// Where the network intends this promo to be shown.
    public let placement: String

    /// The promoted app's name.
    public let appName: String

    /// A short descriptor under the app name, when present.
    public let subtitle: String?

    /// A marketing headline that overrides ``subtitle`` when present.
    public let headline: String?

    /// URL of the app icon, when present.
    public let iconUrl: String?

    /// Screenshot URLs. May be empty.
    public let screenshots: [String]

    /// The App Store URL to open on tap, when present.
    public let storeUrl: String?

    /// The app's category, when present.
    public let category: String?

    /// Average rating, when present.
    public let ratingAvg: Double?

    /// Number of ratings, when present.
    public let ratingCount: Int?

    /// Call-to-action label, e.g. "Get".
    public let cta: String

    /// True when this is a paid placement. When true you must disclose it as
    /// "Sponsored"; the built-in views do this for you.
    public let sponsored: Bool

    public init(
        id: String,
        token: String,
        source: AppFriendsPromoSource,
        placement: String,
        appName: String,
        subtitle: String? = nil,
        headline: String? = nil,
        iconUrl: String? = nil,
        screenshots: [String] = [],
        storeUrl: String? = nil,
        category: String? = nil,
        ratingAvg: Double? = nil,
        ratingCount: Int? = nil,
        cta: String = "Get",
        sponsored: Bool = false
    ) {
        self.id = id
        self.token = token
        self.source = source
        self.placement = placement
        self.appName = appName
        self.subtitle = subtitle
        self.headline = headline
        self.iconUrl = iconUrl
        self.screenshots = screenshots
        self.storeUrl = storeUrl
        self.category = category
        self.ratingAvg = ratingAvg
        self.ratingCount = ratingCount
        self.cta = cta
        self.sponsored = sponsored
    }

    /// The text to show beneath the app name: ``headline`` when present,
    /// otherwise ``subtitle``.
    public var displaySubtitle: String? {
        if let headline, !headline.isEmpty { return headline }
        return subtitle
    }

    /// A parsed `storeUrl`, when it's a valid URL.
    public var storeURL: URL? {
        guard let storeUrl else { return nil }
        return URL(string: storeUrl)
    }

    /// A parsed `iconUrl`, when it's a valid URL.
    public var iconURL: URL? {
        guard let iconUrl else { return nil }
        return URL(string: iconUrl)
    }

    /// The first up-to-`count` screenshot URLs that parse as valid URLs.
    public func screenshotURLs(limit count: Int = 3) -> [URL] {
        screenshots.prefix(count).compactMap { URL(string: $0) }
    }
}

/// The promotions response from `GET /api/v1/sdk/promotions`.
struct PromotionsResponse: Codable, Sendable {
    let promos: [Promo]
    /// Server time (ISO 8601).
    let servedAt: String
    /// When the client should stop using this cached response (ISO 8601).
    let expiresAt: String
    let placement: String
}

/// Remote SDK configuration from `GET /api/v1/sdk/config`. Lets the network
/// tune behavior without an app update.
public struct AppFriendsConfig: Codable, Sendable {
    /// Whether the network has inventory for this app right now.
    public let enabled: Bool
    /// Seconds the client may cache a promotions response.
    public let cacheSeconds: Int
    /// Minimum seconds between full-screen takeovers.
    public let minIntervalSeconds: Int
    /// Default placement when the host doesn't specify one.
    public let defaultPlacement: String
    /// Theme accent (hex), mirroring the app's brand, when set.
    public let accentColor: String?
}

/// The event types the SDK reports.
enum AppFriendsEventType: String, Codable, Sendable {
    case impression
    case tap
    case install
}

/// A single event in an `events` batch.
struct AppFriendsEvent: Codable, Sendable {
    let token: String
    let type: AppFriendsEventType
    let country: String?
}

/// The body of `POST /api/v1/sdk/events`.
struct EventsRequest: Codable, Sendable {
    let events: [AppFriendsEvent]
}

/// The response from `POST /api/v1/sdk/events`.
struct EventsResponse: Codable, Sendable {
    let accepted: Int
}

/// Errors the SDK can surface. Most callers never see these — the rendering
/// views and event reporting swallow failures and render nothing.
public enum AppFriendsError: Error, Sendable {
    /// `configure` hasn't been called yet.
    case notConfigured
    /// The server returned a non-2xx status.
    case http(status: Int)
    /// The response body didn't decode.
    case decoding
}
