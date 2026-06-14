import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#FBFAFF",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 2,
            top: 6,
            width: 18,
            height: 18,
            borderRadius: 5,
            background: "#6D4AFF",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 12,
            top: 8,
            width: 18,
            height: 18,
            borderRadius: 5,
            background: "#FF6B5E",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
