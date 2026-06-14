// Resolve `@parra/app-friends` straight from the SDK's TypeScript source
// in the parent folder, so editing the SDK live-reloads here — and so React /
// React Native always resolve to *this* example's copies (the usual "two Reacts"
// trap with local library examples).
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const sdkRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the SDK source so changes there trigger a reload.
config.watchFolders = [sdkRoot];

config.resolver.extraNodeModules = {
  "@parra/app-friends": path.resolve(sdkRoot, "src"),
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
};

// Only ever resolve packages from the example's node_modules (never the SDK's,
// which carries its own dev copy of React).
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

module.exports = config;
