// swift-tools-version: 5.9
import PackageDescription

// Root manifest so the AppFriends Swift package is installable straight from this
// monorepo over Swift Package Manager:
//
//   .package(url: "https://github.com/Parra-Inc/app-friends", from: "0.1.0")
//
// The sources live under sdks/swift; the standalone manifest there
// (sdks/swift/Package.swift) is used for local development and the example app.
let package = Package(
    name: "AppFriends",
    platforms: [
        .iOS(.v16),
        .macOS(.v13),
    ],
    products: [
        .library(
            name: "AppFriends",
            targets: ["AppFriends"]
        ),
    ],
    targets: [
        .target(
            name: "AppFriends",
            path: "sdks/swift/Sources/AppFriends"
        ),
    ]
)
