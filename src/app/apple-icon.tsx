/**
 * Apple touch icon: the arch mark (brand/logo) in warm gold on espresso, drawn once at build time. iOS rounds the
 * corners itself, so the square is full bleed. Owner: pages-lead.
 */
import { ImageResponse } from "next/og";
import { LOGO_MARK } from "@/components/ui/logo-data";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Brand colours (src/styles/tokens.css): Satori has no CSS variables.
const ESPRESSO = "#231a12";
const WARM_GOLD = "#d9b263";
const MARK_HEIGHT = 104;

export default function AppleIcon() {
  const width = (LOGO_MARK.width / 100) * MARK_HEIGHT;
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: ESPRESSO }}>
        <svg width={width} height={MARK_HEIGHT} viewBox={`0 0 ${LOGO_MARK.width} 100`}>
          <path d={LOGO_MARK.d} fill={WARM_GOLD} />
        </svg>
      </div>
    ),
    size,
  );
}
