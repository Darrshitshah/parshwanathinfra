"use client";

import { useEffect, useMemo, useRef } from "react";
import { plan } from "@/content/plan";
import { inkDraw, type Timeline } from "@/motion";
import { paddedViewBox, polygonBounds, polygonToPath, polylineToPath } from "@/motion/geometry";
import { LabButton, LabSection, Row, useLab } from "./lab-ui";

/** inkDraw on the real plan: the boundary and the road centrelines draw one after another. */
export function InkSection() {
  const { reduced } = useLab();
  const svgRef = useRef<SVGSVGElement>(null);
  const timelineRef = useRef<Timeline | null>(null);

  const shape = useMemo(() => {
    const viewBox = paddedViewBox(polygonBounds(plan.boundary), 0.04).join(" ");
    return {
      viewBox,
      boundary: polygonToPath(plan.boundary),
      roads: plan.roads.map((road) => ({ id: road.id, d: polylineToPath(road.centerline) })),
    };
  }, []);

  const play = () => {
    const svg = svgRef.current;
    if (!svg) return;
    timelineRef.current?.kill();
    timelineRef.current = inkDraw(svg, { reduced, duration: 1.8, stagger: 0.25 });
  };

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  return (
    <LabSection
      id="ink"
      title="inkDraw"
      note="DrawSVG strokes: the boundary draws as one continuous line, then the road centrelines follow. Geometry comes from plan.json, never from the component."
    >
      <Row>
        <LabButton onClick={play}>Replay</LabButton>
      </Row>
      <svg ref={svgRef} viewBox={shape.viewBox} className="w-full max-w-4xl text-ink" role="img" aria-label="Township outline">
        <path
          d={shape.boundary}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {shape.roads.map((road) => (
          <path
            key={road.id}
            d={road.d}
            fill="none"
            stroke="var(--brick)"
            strokeWidth="1.25"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </LabSection>
  );
}
