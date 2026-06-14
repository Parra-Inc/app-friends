import { ImageResponse } from "next/og";

export const alt = "App Friends — trade installs with apps that aren't your competition.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background:
            "radial-gradient(900px 500px at 10% -10%, #6D4AFF33, transparent), radial-gradient(700px 400px at 100% 0%, #FF6B5E33, transparent), #FBFAFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 40 }}>
          <div style={{ display: "flex", position: "relative", width: 70, height: 70 }}>
            <div style={{ position: "absolute", left: 0, top: 12, width: 44, height: 44, borderRadius: 12, background: "#6D4AFF" }} />
            <div style={{ position: "absolute", left: 24, top: 16, width: 44, height: 44, borderRadius: 12, background: "#FF6B5E" }} />
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 36, fontWeight: 700 }}>
            <span style={{ color: "#6D4AFF" }}>App</span>
            <span style={{ color: "#FF6B5E" }}>Friends</span>
          </div>
        </div>
        <div style={{ fontSize: 68, fontWeight: 700, color: "#14122B", lineHeight: 1.1, maxWidth: 900 }}>
          Trade installs with apps that aren&apos;t your competition.
        </div>
        <div style={{ fontSize: 30, color: "#3A3756", marginTop: 28 }}>
          The cross-promotion network + SDK for app developers.
        </div>
      </div>
    ),
    { ...size }
  );
}
