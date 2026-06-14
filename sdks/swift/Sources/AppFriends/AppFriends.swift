import Foundation

/// The App Friends client.
///
/// App Friends is a cross-promotion network for app developers. You configure
/// the SDK once with your publishable key, then either drop in one of the
/// built-in views (``SwiftUI/View/appFriendsPopup(isPresented:placement:)`` or
/// ``AppFriendsView``) or fetch promos yourself with ``promotions(placement:limit:)``.
///
/// ## Quick start
///
/// ```swift
/// // In your App's init:
/// AppFriends.configure(apiKey: "afp_live_xxx")
///
/// // Anywhere in your view tree:
/// .appFriendsPopup(isPresented: $showPromo)
/// ```
///
/// Everything here runs on the main actor. Fetching is `async`; event reporting
/// is fire-and-forget and never throws back to you.
@MainActor
public final class AppFriends {

    /// The shared client. You usually interact with the static helpers
    /// (``configure(apiKey:bundleId:baseURL:)``, ``promotions(placement:limit:)``,
    /// and the `report…` methods) rather than this directly.
    public static let shared = AppFriends()

    // MARK: Configuration

    private var apiKey: String?
    private var bundleId: String?
    private var baseURL: URL = URL(string: "https://appfriends.dev")!

    /// The two-letter country code sent with requests and events, when known.
    /// Defaults to the device region. Set it yourself if you have a better
    /// signal.
    public var country: String? = AppFriends.deviceCountry()

    // MARK: State

    private let session: URLSession
    private let defaults: UserDefaults

    /// Cached promotions keyed by placement wire value, with their expiry.
    private var promoCache: [String: CachedPromos] = [:]
    /// Remote config, fetched lazily and cached for the process lifetime.
    private var remoteConfig: AppFriendsConfig?

    /// Pending events awaiting a debounced flush.
    private var pendingEvents: [AppFriendsEvent] = []
    private var flushTask: Task<Void, Never>?
    /// How long to wait for more events before flushing a batch.
    private let flushDebounce: Duration = .milliseconds(750)

    private struct CachedPromos {
        let promos: [Promo]
        let expiresAt: Date
    }

    private static let lastFullScreenKey = "com.appfriends.lastFullScreenShown"

    // MARK: Init

    init(session: URLSession = .shared, defaults: UserDefaults = .standard) {
        self.session = session
        self.defaults = defaults
    }

    // MARK: Configuration API

    /// Configures the SDK. Call this once, early — typically in your `App`'s
    /// initializer.
    ///
    /// - Parameters:
    ///   - apiKey: Your publishable key (looks like `afp_…`). Safe to ship in
    ///     the binary.
    ///   - bundleId: The host app's bundle id. Defaults to
    ///     `Bundle.main.bundleIdentifier`.
    ///   - baseURL: Override the API base URL. Defaults to
    ///     `https://appfriends.dev`.
    public static func configure(apiKey: String, bundleId: String? = nil, baseURL: URL? = nil) {
        shared.configure(apiKey: apiKey, bundleId: bundleId, baseURL: baseURL)
    }

    func configure(apiKey: String, bundleId: String?, baseURL: URL?) {
        self.apiKey = apiKey
        self.bundleId = bundleId ?? Bundle.main.bundleIdentifier
        if let baseURL { self.baseURL = baseURL }
    }

    /// True once ``configure(apiKey:bundleId:baseURL:)`` has run.
    public static var isConfigured: Bool { shared.apiKey != nil }

    // MARK: Promotions

    /// Fetches promos for a placement.
    ///
    /// The response is cached until the server-provided `expiresAt`. Repeat
    /// calls within that window return the cache without hitting the network.
    ///
    /// - Parameters:
    ///   - placement: Where you intend to show the promos. Defaults to
    ///     ``AppFriendsPlacement/popup``.
    ///   - limit: Maximum number of promos to fetch. Defaults to 10.
    /// - Returns: The available promos. Empty when there's no inventory.
    /// - Throws: ``AppFriendsError`` on configuration or network failure.
    public static func promotions(
        placement: AppFriendsPlacement = .popup,
        limit: Int = 10
    ) async throws -> [Promo] {
        try await shared.promotions(placement: placement, limit: limit)
    }

    func promotions(placement: AppFriendsPlacement, limit: Int) async throws -> [Promo] {
        guard let apiKey, let bundleId else { throw AppFriendsError.notConfigured }

        if let cached = promoCache[placement.wireValue], cached.expiresAt > Date() {
            return cached.promos
        }

        var components = URLComponents(url: baseURL.appendingPathComponent("/api/v1/sdk/promotions"),
                                       resolvingAgainstBaseURL: false)
        var query: [URLQueryItem] = [
            URLQueryItem(name: "bundleId", value: bundleId),
            URLQueryItem(name: "placement", value: placement.wireValue),
            URLQueryItem(name: "limit", value: String(limit)),
        ]
        if let country { query.append(URLQueryItem(name: "country", value: country)) }
        components?.queryItems = query

        guard let url = components?.url else { throw AppFriendsError.notConfigured }

        let response: PromotionsResponse = try await get(url: url, apiKey: apiKey)

        let expiresAt = AppFriends.parseISODate(response.expiresAt) ?? Date().addingTimeInterval(300)
        promoCache[placement.wireValue] = CachedPromos(promos: response.promos, expiresAt: expiresAt)
        return response.promos
    }

    /// Fetches (and caches) the remote SDK config.
    ///
    /// - Returns: The remote config, or `nil` if it couldn't be fetched.
    @discardableResult
    public static func config() async -> AppFriendsConfig? {
        await shared.config()
    }

    func config() async -> AppFriendsConfig? {
        if let remoteConfig { return remoteConfig }
        guard let apiKey, let bundleId else { return nil }

        var components = URLComponents(url: baseURL.appendingPathComponent("/api/v1/sdk/config"),
                                       resolvingAgainstBaseURL: false)
        components?.queryItems = [URLQueryItem(name: "bundleId", value: bundleId)]
        guard let url = components?.url else { return nil }

        do {
            let cfg: AppFriendsConfig = try await get(url: url, apiKey: apiKey)
            remoteConfig = cfg
            return cfg
        } catch {
            return nil
        }
    }

    // MARK: Full-screen pacing

    /// Whether enough time has passed since the last full-screen takeover to
    /// show another, per the network's `minIntervalSeconds`.
    ///
    /// The popup and banner placements aren't paced; only full-screen is.
    public static func canShowFullScreen() async -> Bool {
        await shared.canShowFullScreen()
    }

    func canShowFullScreen() async -> Bool {
        let minInterval = TimeInterval((await config())?.minIntervalSeconds ?? 120)
        let last = defaults.double(forKey: AppFriends.lastFullScreenKey)
        guard last > 0 else { return true }
        return Date().timeIntervalSince1970 - last >= minInterval
    }

    /// Records that a full-screen takeover was just shown, resetting the pacing
    /// clock. The built-in full-screen view calls this for you.
    public static func markFullScreenShown() {
        shared.markFullScreenShown()
    }

    func markFullScreenShown() {
        defaults.set(Date().timeIntervalSince1970, forKey: AppFriends.lastFullScreenKey)
    }

    // MARK: Event reporting

    /// Reports that a promo was shown. Fire-and-forget.
    public static func reportImpression(_ promo: Promo) {
        shared.enqueue(token: promo.token, type: .impression)
    }

    /// Reports that a promo was tapped. Echoes the promo's attribution token.
    /// Fire-and-forget.
    public static func reportTap(_ promo: Promo) {
        shared.enqueue(token: promo.token, type: .tap)
    }

    /// Reports an install attributed to a promo. Echoes the promo's attribution
    /// token. Fire-and-forget.
    public static func reportInstall(_ promo: Promo) {
        shared.enqueue(token: promo.token, type: .install)
    }

    func enqueue(token: String, type: AppFriendsEventType) {
        guard isConfiguredInstance else { return }
        pendingEvents.append(AppFriendsEvent(token: token, type: type, country: country))
        scheduleFlush()
    }

    private var isConfiguredInstance: Bool { apiKey != nil }

    private func scheduleFlush() {
        flushTask?.cancel()
        flushTask = Task { [weak self] in
            try? await Task.sleep(for: self?.flushDebounce ?? .milliseconds(750))
            guard !Task.isCancelled else { return }
            await self?.flush()
        }
    }

    /// Sends any queued events immediately. Called automatically after a debounce;
    /// you can call it on `scenePhase` background transitions if you want to be
    /// sure events go out promptly.
    public static func flushEvents() {
        Task { await shared.flush() }
    }

    func flush() async {
        guard let apiKey, !pendingEvents.isEmpty else { return }
        let batch = pendingEvents
        pendingEvents.removeAll()

        let url = baseURL.appendingPathComponent("/api/v1/sdk/events")
        do {
            let body = try JSONEncoder().encode(EventsRequest(events: batch))
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            applyAuth(&request, apiKey: apiKey)
            request.httpBody = body
            _ = try await session.data(for: request)
        } catch {
            // Re-queue on failure so events aren't silently lost. Capped to
            // avoid unbounded growth if the network stays down.
            if pendingEvents.count < 200 {
                pendingEvents.insert(contentsOf: batch, at: 0)
            }
        }
    }

    // MARK: Networking helpers

    private func get<T: Decodable>(url: URL, apiKey: String) async throws -> T {
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        applyAuth(&request, apiKey: apiKey)

        let (data, response) = try await session.data(for: request)
        if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
            throw AppFriendsError.http(status: http.statusCode)
        }
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw AppFriendsError.decoding
        }
    }

    private func applyAuth(_ request: inout URLRequest, apiKey: String) {
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue(apiKey, forHTTPHeaderField: "X-AppFriends-Key")
    }

    // MARK: Utilities

    private static let isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private static let isoFormatterNoFraction: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    static func parseISODate(_ string: String) -> Date? {
        isoFormatter.date(from: string) ?? isoFormatterNoFraction.date(from: string)
    }

    static func deviceCountry() -> String? {
        if #available(iOS 16, macOS 13, *) {
            return Locale.current.region?.identifier
        } else {
            return Locale.current.regionCode
        }
    }
}
