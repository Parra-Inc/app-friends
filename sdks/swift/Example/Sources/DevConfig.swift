import Foundation

/// Where this example points and who it claims to be. Everything here matches
/// the data created by the web app's seed (`web/scripts/seed.ts`).
enum DevConfig {
    /// The stable publishable key the seed mints for the sample tenant.
    static let apiKey = "afp_dev_sample_publishable_key_00000001"

    /// The host app's bundle id. We pose as the seeded "Nimbus Weather" so the
    /// network returns its friends and never itself.
    static let bundleId = "com.nimbuslabs.weather"

    /// Your local App Friends server.
    ///
    /// - Simulator: `http://localhost:3050` works as-is.
    /// - Real device: swap in your Mac's LAN IP, e.g.
    ///   `http://192.168.1.20:3050` (find it with `ipconfig getifaddr en0`),
    ///   and make sure your phone is on the same Wi-Fi. The Info.plist already
    ///   allows local-network HTTP for dev.
    static let baseURL = URL(string: "http://localhost:3050")!
}
