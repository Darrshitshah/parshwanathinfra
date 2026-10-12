"use client";

/**
 * The curtain's markup. Owner: motion-lead. Presentational: `TransitionProvider` owns the refs and plays it.
 *
 * Two layers, one of which is shown (CSS keys on `data-variant`):
 *  - "hole": an SVG sheet in the curtain red (a soft diagonal sheen, no lines) with the township boundary cut out (Tier A);
 *  - "panel": a panel in the same red that slides (Tier B, or until the plan shape has loaded).
 * The next page's title slides through whichever is showing.
 */
import { useMemo, type RefObject } from "react";
import {
  outerRect,
  paddedViewBox,
  polygonBounds,
  sheetWithHolePath,
  type Point,
} from "@/motion/geometry";
import "./transition.css";

const EYEBROW = "Parshwanath Infra";
const VIEWBOX_PADDING = 0.1;
/** The sheen gradient reaches this share of the view box beyond each edge, so the sheet is never flat at the screen corners. */
const SHEEN_REACH = 0.5;
const SHEEN_ID = "pi-curtain-sheen";

export interface CurtainProps {
  rootRef: RefObject<HTMLDivElement | null>;
  svgRef: RefObject<SVGSVGElement | null>;
  holeRef: RefObject<SVGPathElement | null>;
  labelRef: RefObject<HTMLSpanElement | null>;
  /** The township boundary, or null while it is not known (only the panel layer is then rendered). */
  boundary: readonly Point[] | null;
  variant: "hole" | "panel";
}

export function Curtain({ rootRef, svgRef, holeRef, labelRef, boundary, variant }: CurtainProps) {
  const geometry = useMemo(() => {
    if (!boundary || boundary.length < 3) return null;
    const bounds = polygonBounds(boundary);
    const box = paddedViewBox(bounds, VIEWBOX_PADDING).map((value) => Math.round(value * 100) / 100);
    const [x, y, width, height] = box;
    return {
      viewBox: box.join(" "),
      closedSheet: sheetWithHolePath(outerRect(bounds), []),
      sheen: {
        x1: x - width * SHEEN_REACH,
        y1: y - height * SHEEN_REACH,
        x2: x + width * (1 + SHEEN_REACH),
        y2: y + height * (1 + SHEEN_REACH),
      },
    };
  }, [boundary]);

  return (
    <div ref={rootRef} className="pi-curtain" data-curtain="" data-variant={variant} aria-hidden="true">
      {geometry ? (
        <svg
          ref={svgRef}
          className="pi-curtain__svg"
          viewBox={geometry.viewBox}
          preserveAspectRatio="xMidYMid meet"
          focusable="false"
        >
          <defs>
            <linearGradient id={SHEEN_ID} gradientUnits="userSpaceOnUse" {...geometry.sheen}>
              <stop offset="0" className="pi-curtain__stop pi-curtain__stop--sheen" />
              <stop offset="0.45" className="pi-curtain__stop pi-curtain__stop--base" />
              <stop offset="1" className="pi-curtain__stop pi-curtain__stop--deep" />
            </linearGradient>
          </defs>
          <path
            ref={holeRef}
            className="pi-curtain__sheet"
            fill={`url(#${SHEEN_ID})`}
            fillRule="evenodd"
            d={geometry.closedSheet}
          />
        </svg>
      ) : null}
      <div className="pi-curtain__panel" data-curtain-panel="" />
      <div className="pi-curtain__title">
        <span className="pi-curtain__eyebrow" data-curtain-eyebrow="">
          {EYEBROW}
        </span>
        <span className="pi-curtain__mask">
          <span ref={labelRef} className="pi-curtain__label" data-curtain-label="" />
        </span>
        <span className="pi-curtain__rule" data-curtain-rule="" />
      </div>
    </div>
  );
}
