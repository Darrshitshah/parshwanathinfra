"use client";

/**
 * The curtain's markup. Owner: motion-lead. Presentational: `TransitionProvider` owns the refs and plays it.
 *
 * Two layers, one of which is shown (CSS keys on `data-variant`):
 *  - "hole": an SVG sheet in the brand colour with the township boundary cut out of it (Tier A);
 *  - "panel": a plain brand-colour panel that slides (Tier B, or until the plan shape has loaded).
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
    return {
      viewBox: paddedViewBox(bounds, VIEWBOX_PADDING).map((value) => Math.round(value * 100) / 100).join(" "),
      closedSheet: sheetWithHolePath(outerRect(bounds), []),
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
          <path ref={holeRef} className="pi-curtain__sheet" fillRule="evenodd" d={geometry.closedSheet} />
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
