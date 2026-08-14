import { ImageResponse } from "next/og";

export const alt = "Mon Petit Hockey — pronostics entre amis pour la Coupe du monde de hockey 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f9d6c, #d68a1a)",
          color: "#fff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 44,
            left: 56,
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          🏑 mon-petit-hockey.cestfun.workers.dev
        </div>
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: 999,
            background: "rgba(255,255,255,0.2)",
            border: "4px solid rgba(255,255,255,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 84,
            marginBottom: 28,
          }}
        >
          🏑
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800 }}>Mon Petit Hockey</div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 30, fontWeight: 500, opacity: 0.92 }}>
          Pronostics entre amis — Coupe du monde 2026
        </div>
      </div>
    ),
    { ...size },
  );
}
