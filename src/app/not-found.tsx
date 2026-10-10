/**
 * 404. Owner: pages-lead. The township boundary (from src/content/plan, the single source of geometry) draws itself
 * as one ink line, the roundabout and the main entry are marked, and a dashed leader runs from "You are here" outside
 * the boundary to the way back. "You are off the plan." and links home and to the project. The draw is CSS only and
 * lands on its end state at once under reduced motion.
 */
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { TextLink } from "@/components/ui/TextLink";
import { Eyebrow } from "@/components/ui/Section";
import { notFoundCopy } from "@/content/copy/not-found";
import { plan } from "@/content/plan";

export const metadata: Metadata = {
  title: notFoundCopy.metaTitle,
  robots: { index: false, follow: true },
};

type Pt = readonly [number, number];

function toPath(points: readonly Pt[]): string {
  return `${points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ")} Z`;
}

export default function NotFound() {
  const boundary = plan.boundary;
  const xs = boundary.map(([x]) => x);
  const ys = boundary.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;

  // Padding leaves room for the "You are here" marker above the top-left corner and for the entry arrow.
  const padX = width * 0.06;
  const padTop = height * 0.34;
  const padBottom = height * 0.08;
  const viewX = minX - padX;
  const viewY = minY - padTop;
  const viewW = width + padX * 2;
  const viewH = height + padTop + padBottom;

  const entry = plan.entries.find((item) => item.kind === "main");
  const roundabout = plan.roundabout;
  const arrowLength = width * 0.045;

  // The marker sits outside the boundary, above its left end; the leader runs to the roundabout.
  const marker = { x: minX + width * 0.12, y: minY - height * 0.2 };
  const target = roundabout.center;

  const pct = (x: number, y: number) => ({
    left: `${((x - viewX) / viewW) * 100}%`,
    top: `${((y - viewY) / viewH) * 100}%`,
  });

  return (
    <section aria-labelledby="not-found-title" className="section-pad bg-grid">
      <div className="wrap grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-x-(--gutter)">
        <div className="lg:col-span-5">
          <Eyebrow index="404">{notFoundCopy.eyebrow}</Eyebrow>
          <h1 id="not-found-title" className="t-display-1 mt-8 text-ink md:mt-12 md:text-[clamp(5.5rem,8vw,8.5rem)]">
            {notFoundCopy.title}
          </h1>
          <p className="t-lead mt-6 max-w-[28rem] text-ink-muted">{notFoundCopy.text}</p>
          <p className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <TextLink href="/" arrow="right">
              {notFoundCopy.home}
            </TextLink>
            <TextLink href="/projects/shiv-shiva" arrow="right">
              {notFoundCopy.project}
            </TextLink>
          </p>
        </div>

        <figure className="m-0 lg:col-span-7" data-not-found-plan="">
          <div className="relative w-full" style={{ aspectRatio: `${viewW} / ${viewH}` }}>
            <svg
              viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
              className="absolute inset-0 size-full overflow-visible"
              role="img"
              aria-label={notFoundCopy.mapLabel}
            >
              <path d={toPath(boundary)} fill="var(--paper-sunk)" fillOpacity="0.8" stroke="none" />
              <path
                d={toPath(boundary)}
                className="draw-path"
                pathLength={1}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={2.5}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ "--draw-duration": "2600ms" } as CSSProperties}
              />
              <circle cx={roundabout.center[0]} cy={roundabout.center[1]} r={roundabout.radius} fill="none" stroke="var(--brick)" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
              <circle cx={roundabout.center[0]} cy={roundabout.center[1]} r={roundabout.radius * 0.28} fill="var(--brick)" />
              {entry ? (
                <path
                  d={`M ${entry.point[0]} ${entry.point[1]} h ${-arrowLength} m ${arrowLength * 0.45} ${-arrowLength * 0.3} l ${-arrowLength * 0.45} ${arrowLength * 0.3} l ${arrowLength * 0.45} ${arrowLength * 0.3}`}
                  fill="none"
                  stroke="var(--brick)"
                  strokeWidth={2.5}
                  strokeLinecap="square"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              <line
                x1={marker.x}
                y1={marker.y}
                x2={target[0]}
                y2={target[1]}
                stroke="var(--ink)"
                strokeWidth={1.25}
                strokeDasharray="5 7"
                vectorEffect="non-scaling-stroke"
                opacity="0.65"
              />
              <circle cx={marker.x} cy={marker.y} r={width * 0.011} fill="var(--brick)" stroke="var(--paper)" strokeWidth={3} vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="t-mono-sm absolute whitespace-nowrap text-ink" style={{ ...pct(marker.x, marker.y), transform: "translate(14px, -50%)" }}>
              <span className="bg-paper px-1.5 py-0.5">
                {notFoundCopy.here} · {notFoundCopy.hereNote}
              </span>
            </span>
          </div>
          <figcaption className="t-mono-sm mt-3 text-ink-muted">{notFoundCopy.mapLabel}</figcaption>
        </figure>
      </div>
    </section>
  );
}
