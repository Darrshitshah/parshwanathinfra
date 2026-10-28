/**
 * Static fallback visual for the location map: the server render, the view while the live street map loads, and what
 * stays if it cannot (no JavaScript, no WebGL, save-data, tile failure): the Vapi-Silvassa Road and the site pin on a faint survey grid, labelled "Not to scale". It shows how the
 * places relate, never how far apart they are; landmarks and distances stay TBD so none are drawn.
 * The drawing is SVG; the labels are HTML placed in percentages so they stay readable at 360 px. Server component.
 * Owner: pages-lead.
 */
import type { CSSProperties } from "react";
import { homeCopy } from "@/content/copy/home";
import { en } from "@/content/i18n/en";
import type { MapPlace } from "./place";

const W = 600;
const H = 440;

/** Cubic road from Vapi (top left) to Silvassa (bottom right). */
const ROAD = { p0: [92, 96], p1: [230, 112], p2: [350, 205], p3: [508, 336] } as const;
const ROAD_PATH = `M ${ROAD.p0.join(" ")} C ${ROAD.p1.join(" ")}, ${ROAD.p2.join(" ")}, ${ROAD.p3.join(" ")}`;

function pointOnRoad(t: number): { x: number; y: number } {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * ROAD.p0[0] + b * ROAD.p1[0] + c * ROAD.p2[0] + d * ROAD.p3[0],
    y: a * ROAD.p0[1] + b * ROAD.p1[1] + c * ROAD.p2[1] + d * ROAD.p3[1],
  };
}

const VAPI = { x: ROAD.p0[0], y: ROAD.p0[1] };
const SILVASSA = { x: ROAD.p3[0], y: ROAD.p3[1] };
const SITE = pointOnRoad(0.78);
const ROAD_LABEL = pointOnRoad(0.4);
const ROAD_LABEL_ANGLE = 25.5;
const GRID_STEP = 40;

function place(x: number, y: number, transform: string): CSSProperties {
  return { left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, transform };
}

const LABEL = "t-mono-sm absolute whitespace-nowrap text-ink";

const GRID_LINES = {
  vertical: Array.from({ length: Math.floor(W / GRID_STEP) - 1 }, (_, index) => (index + 1) * GRID_STEP),
  horizontal: Array.from({ length: Math.floor(H / GRID_STEP) }, (_, index) => (index + 1) * GRID_STEP),
};

export function SchematicFallback({ place: site }: { place: MapPlace }) {
  return (
    <div className="absolute inset-0 grid place-items-center" data-map-fallback>
      <div className="relative aspect-[600/440] w-full">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" role="img" aria-labelledby="map-title map-desc">
          <title id="map-title">{homeCopy.location.mapCaption}</title>
          <desc id="map-desc">{homeCopy.location.mapTitle}</desc>
          <g stroke="var(--grid)" strokeWidth="1">
            {GRID_LINES.vertical.map((x) => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2={H} />
            ))}
            {GRID_LINES.horizontal.map((y) => (
              <line key={`h${y}`} x1="0" y1={y} x2={W} y2={y} />
            ))}
          </g>
          <path d={ROAD_PATH} fill="none" stroke="var(--ink)" strokeOpacity="0.16" strokeWidth="22" strokeLinecap="round" />
          <path d={ROAD_PATH} fill="none" stroke="var(--paper-raised)" strokeWidth="13" strokeLinecap="round" />
          <path d={ROAD_PATH} fill="none" stroke="var(--ink)" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="2 9" strokeLinecap="round" />
          {[VAPI, SILVASSA].map((node) => (
            <g key={`${node.x}-${node.y}`}>
              <circle cx={node.x} cy={node.y} r="12" fill="var(--paper-raised)" />
              <circle cx={node.x} cy={node.y} r="5" fill="var(--ink)" />
            </g>
          ))}
          <circle cx={SITE.x} cy={SITE.y} r="17" fill="var(--brick)" fillOpacity="0.16" />
          <circle cx={SITE.x} cy={SITE.y} r="9" fill="var(--brick)" stroke="var(--paper-raised)" strokeWidth="2.5" />
        </svg>

        <span className={LABEL} style={place(VAPI.x, VAPI.y + 20, "translate(-50%, 0)")}>
          Vapi
        </span>
        <span className={LABEL} style={place(SILVASSA.x, SILVASSA.y + 20, "translate(-50%, 0)")}>
          Silvassa
        </span>
        <span
          className={`${LABEL} text-ink-muted`}
          style={place(ROAD_LABEL.x, ROAD_LABEL.y - 16, `translate(-50%, -50%) rotate(${ROAD_LABEL_ANGLE}deg)`)}
        >
          {site.road}
        </span>
        <span
          className="t-mono-sm glass absolute whitespace-nowrap rounded-full px-3 py-1 text-brick-ink"
          style={place(SITE.x + 14, SITE.y - 14, "translate(0, -100%)")}
        >
          {homeCopy.location.map.siteLabel}
        </span>
      </div>
      <span className="t-mono-sm glass absolute bottom-3 right-3 rounded-full px-3 py-1 text-ink">{en.common.notToScale}</span>
    </div>
  );
}
