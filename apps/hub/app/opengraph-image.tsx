import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#12232E",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#F2A93B",
            color: "#12232E",
            fontSize: 40,
            fontWeight: 700,
            marginBottom: 40,
          }}
        >
          K
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#F7F3EC" }}>
          Get It Sorted
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#1F7A6C", marginTop: 16 }}>
          The right help. From the right people. Followed through.
        </div>
      </div>
    ),
    { ...size }
  );
}
