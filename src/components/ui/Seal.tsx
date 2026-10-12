/**
 * The round seal: "Shiv Shiva Township · Parshwanath Infra" set on a circle around the roundabout from the plan (the
 * site's one brand device). Pure SVG and CSS, no image. Decorative by default (the link or heading next to it carries
 * the name); the ring turns slowly (transform only, off under reduced motion).
 */
import { useId } from "react";
import { cn } from "./cn";

const TEXT = "Shiv Shiva Township · Parshwanath Infra · ";
const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface SealProps {
  /** Rendered size in px (the drawing is vector). */
  size?: number;
  /** Turn the lettering slowly. */
  spin?: boolean;
  className?: string;
}

export function Seal({ size = 56, spin = false, className }: SealProps) {
  const pathId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("seal", className)}
    >
      <defs>
        <path id={pathId} d={`M 100 100 m -${RADIUS} 0 a ${RADIUS} ${RADIUS} 0 1 1 ${RADIUS * 2} 0 a ${RADIUS} ${RADIUS} 0 1 1 -${RADIUS * 2} 0`} />
      </defs>
      <g className={spin ? "seal__ring seal__ring--spin" : "seal__ring"}>
        <text className="seal__text" fill="currentColor">
          <textPath href={`#${pathId}`} textLength={CIRCUMFERENCE - 2} lengthAdjust="spacing">
            {TEXT}
          </textPath>
        </text>
      </g>
      <circle cx="100" cy="100" r="31" stroke="currentColor" strokeWidth="5" />
      <circle cx="100" cy="100" r="9.5" fill="currentColor" />
    </svg>
  );
}
