// swift-tools-version: 5.9
import PackageDescription

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
            name: "AppFriends"
        ),
    ]
)
