import SwiftUI
import AppFriends

@main
struct AppFriendsExampleApp: App {
    init() {
        // Configure once, at launch. Points at your local server and poses as
        // the seeded Nimbus Weather app.
        AppFriends.configure(
            apiKey: DevConfig.apiKey,
            bundleId: DevConfig.bundleId,
            baseURL: DevConfig.baseURL
        )
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
