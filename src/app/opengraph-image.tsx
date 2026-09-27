import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} · ${siteConfig.tagline}`;
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
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at 50% 0%, #3a2f18 0%, #0a0a0a 60%)",
          color: "#faf8f4",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 10, color: "#c5a25a", textTransform: "uppercase" }}>
          Perfumería árabe & de diseñador
        </div>
        <div style={{ display: "flex", fontSize: 130, letterSpacing: 18, marginTop: 24, textTransform: "uppercase" }}>
          Smell<span style={{ color: "#c5a25a" }}>club</span>
        </div>
        <div style={{ fontSize: 40, fontStyle: "italic", marginTop: 16, opacity: 0.85 }}>{siteConfig.tagline}</div>
      </div>
    ),
    size,
  );
}
