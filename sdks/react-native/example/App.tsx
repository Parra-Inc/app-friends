import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import {
  AppFriends,
  AppFriendsPopup,
  AppFriendsFullScreen,
  openStore,
  useAppFriends,
  type Promo,
} from "@parra/app-friends";

// ---------------------------------------------------------------------------
// Configure once, before anything renders.
//
// Derive the dev-server URL from Expo's host so this works on a real device in
// Expo Go (not just the simulator). Falls back to localhost. The server runs on
// :3050 (see web/scripts/dev.sh).
// ---------------------------------------------------------------------------
function devBaseURL(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    // @ts-expect-error debuggerHost exists on older Expo runtimes
    Constants.expoGoConfig?.debuggerHost ??
    "";
  const host = String(hostUri).split(":")[0];
  if (host && host !== "localhost") return `http://${host}:3050`;
  return "http://localhost:3050";
}

AppFriends.configure({
  // The stable publishable key the web seed mints for the sample tenant.
  apiKey: "afp_dev_sample_publishable_key_00000001",
  // Pose as the seeded "Nimbus Weather" so the network returns its friends
  // (Brightwords, Habit Garden) and never itself.
  bundleId: "com.nimbuslabs.weather",
  baseURL: devBaseURL(),
});

const ACCENT = "#6D4AFF";

export default function App() {
  const [showPopup, setShowPopup] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  // The "build your own UI" path: fetch promos and render them yourself.
  const { promos, loading, error, reload } = useAppFriends({
    placement: "POPUP",
    limit: 5,
  });

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>App Friends</Text>
        <Text style={styles.caption}>
          This app poses as <Text style={styles.bold}>Nimbus Weather</Text>. The
          network returns its friends — Brightwords (sponsored) and Habit Garden
          (pairing) — never itself.
        </Text>

        <Text style={styles.section}>Overlays</Text>
        <Button label="Show popup" onPress={() => setShowPopup(true)} />
        <Button
          label="Show full-screen takeover"
          onPress={() => setShowFullScreen(true)}
        />

        <View style={styles.row}>
          <Text style={styles.section}>Manual fetch</Text>
          <Pressable onPress={reload} hitSlop={8}>
            <Text style={styles.link}>Reload</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 16 }} />
        ) : error ? (
          <Text style={styles.empty}>{error.message}</Text>
        ) : promos.length === 0 ? (
          <Text style={styles.empty}>
            No inventory. Is the web app running and seeded?
          </Text>
        ) : (
          promos.map((promo) => <PromoRow key={promo.id} promo={promo} />)
        )}
      </ScrollView>

      {/* Driven by booleans; each calls onClose on dismiss or no inventory. */}
      <AppFriendsPopup
        visible={showPopup}
        onClose={() => setShowPopup(false)}
        accentColor={ACCENT}
      />
      <AppFriendsFullScreen
        visible={showFullScreen}
        onClose={() => setShowFullScreen(false)}
        accentColor={ACCENT}
      />
    </SafeAreaView>
  );
}

/** One manually-rendered promo. Reports an impression on appear; on "Get"
 *  reports a tap and opens the store. */
function PromoRow({ promo }: { promo: Promo }) {
  useEffect(() => {
    AppFriends.reportImpression(promo);
  }, [promo]);

  const onGet = async () => {
    AppFriends.reportTap(promo);
    await openStore(promo);
  };

  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.appName} numberOfLines={1}>
            {promo.appName}
          </Text>
          {promo.sponsored ? <Text style={styles.tag}>SPONSORED</Text> : null}
        </View>
        {promo.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {promo.subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable
        style={({ pressed }) => [styles.get, { opacity: pressed ? 0.85 : 1 }]}
        onPress={onGet}
      >
        <Text style={styles.getText}>{promo.cta || "Get"}</Text>
      </Pressable>
    </View>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F5F7" },
  content: { padding: 20, gap: 10 },
  title: { fontSize: 30, fontWeight: "800", color: "#15151A" },
  caption: { fontSize: 14, color: "#52525B", lineHeight: 20, marginBottom: 8 },
  bold: { fontWeight: "700", color: "#15151A" },
  section: { fontSize: 13, fontWeight: "700", color: "#8A8A92", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { color: ACCENT, fontWeight: "600", marginTop: 16 },
  button: { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  empty: { color: "#8A8A92", fontSize: 14, marginTop: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    gap: 12,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  appName: { fontSize: 16, fontWeight: "700", color: "#15151A", flexShrink: 1 },
  tag: { fontSize: 10, fontWeight: "700", color: "#8A8A92", letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: "#52525B", marginTop: 2 },
  get: { backgroundColor: ACCENT, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  getText: { color: "#FFFFFF", fontWeight: "700" },
});
