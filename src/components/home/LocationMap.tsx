/**
 * Stylised map: Vapi, Silvassa, the Vapi-Silvassa Road and the site pin. A schematic, labelled "Not to scale":
 * it shows how the places relate, never how far apart they are. The site sits on the road nearer Silvassa (the
 * source pack places it near Silvassa). Landmarks and distances stay TBD until Darshit confirms them, so none are
 * drawn. The drawing is SVG; the labels are HTML placed in percentages so they keep a readable size at 360 px.
 * Owner: pages-lead.
 */
import type { CSSProperties } from "react";
import { en } from "@/content/i18n/en";
import { homeCopy } from "@/content/copy/home";
import { shivShiva } from "@/content/projects";

const W = 600;
const H = 440;

/** Cubic road from Vapi (top left) to Silvassa (bottom right). */
const ROAD = { p0: [60, 96], p1: [210, 112], p2: [340, 205], p3: [548, 336] } as const;
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

function place(x: number, y: number, transform: string): CSSProperties {
  return { left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, transform };
}

const LABEL = "t-mono-sm absolute whitespace-nowrap text-ink";

export function LocationMap({ className }: { className?: string }) {
  const projectName = shivShiva.name;
  return (
    <figure className={className ?? "m-0"}>
      <div className="relative aspect-[600/440] w-full overflow-hidden border border-line-strong bg-paper-sunk">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" role="img" aria-labelledby="map-title map-desc">
          <title id="map-title">{homeCopy.location.mapCaption}</title>
          <desc id="map-desc">{homeCopy.location.mapTitle}</desc>
          <g stroke="var(--grid)" strokeWidth="1" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <line key={`v${i}`} x1={(i + 1) * 40} y1="0" x2={(i + 1) * 40} y2={H} />
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={(i + 1) * 40} x2={W} y2={(i + 1) * 40} />
            ))}
          </g>
          <path d={ROAD_PATH} fill="none" stroke="var(--ink)" strokeOpacity="0.55" strokeWidth="13" strokeLinecap="butt" />
          <path d={ROAD_PATH} fill="none" stroke="var(--paper-raised)" strokeWidth="9.5" strokeLinecap="butt" />
          <path d={ROAD_PATH} fill="none" stroke="var(--ink)" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="8 7" />
          {[VAPI, SILVASSA].map((node) => (
            <g key={`${node.x}-${node.y}`}>
              <circle cx={node.x} cy={node.y} r="11" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
              <circle cx={node.x} cy={node.y} r="3.5" fill="var(--ink)" />
            </g>
          ))}
          <circle cx={SITE.x} cy={SITE.y} r="17" fill="var(--brick)" fillOpacity="0.16" />
          <circle cx={SITE.x} cy={SITE.y} r="9" fill="var(--brick)" stroke="var(--paper)" strokeWidth="2.5" />
          <g stroke="var(--ink)" strokeWidth="1.5" fill="none" aria-hidden="true">
            <path d={`M ${W - 40} 74 L ${W - 40} 34 M ${W - 49} 46 L ${W - 40} 34 L ${W - 31} 46`} />
          </g>
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
          {shivShiva.location.road}
        </span>
        <span
          className="absolute whitespace-nowrap bg-paper px-1.5 py-1 text-ink shadow-[0_0_0_1px_var(--line-strong)] sm:px-2"
          style={place(SITE.x + 10, SITE.y - 16, "translate(0, -100%)")}
        >
          <span className="t-mono-sm block text-brick-ink">Site</span>
          <span className="font-display text-[0.9375rem] leading-none sm:text-[1.125rem]">{projectName}</span>
        </span>
        <span className={`${LABEL} text-ink-muted`} style={place(W - 40, 22, "translate(-50%, -50%)")}>
          N
        </span>
        <span className="t-mono-sm absolute bottom-3 left-3 border border-line-strong bg-paper px-2 py-1 text-ink">{en.common.notToScale}</span>
      </div>
      <figcaption className="t-mono-sm mt-3 text-ink-muted">{homeCopy.location.mapCaption}</figcaption>
    </figure>
  );
}
