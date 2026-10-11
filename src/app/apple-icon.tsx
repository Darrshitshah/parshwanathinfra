/** Apple touch icon: the roundabout mark, brick on paper, drawn once at build time. Owner: pages-lead. */
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#f3efe7" }}>
        <svg width="124" height="124" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#b5412f" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="2.75" fill="#b5412f" />
        </svg>
      </div>
    ),
    size,
  );
}
