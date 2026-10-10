"use client";

import { useEffect, useRef } from "react";
import { boulevardWipe, type Timeline } from "@/motion";
import { LabButton, LabSection, Row, useLab } from "./lab-ui";

export function WipeSection() {
  const { reduced } = useLab();
  const lineRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const timelines = useRef<Timeline[]>([]);

  const play = (direction: "ltr" | "rtl") => {
    const line = lineRef.current;
    const block = blockRef.current;
    if (!line || !block) return;
    timelines.current.forEach((timeline) => timeline.progress(1).kill());
    timelines.current = [
      boulevardWipe(line, { direction, reduced, mode: "line" }),
      boulevardWipe(block, { direction, reduced, mode: "reveal" }),
    ];
  };

  useEffect(() => {
    const active = timelines.current;
    return () => active.forEach((timeline) => timeline.progress(1).kill());
  }, []);

  return (
    <LabSection
      id="wipe"
      title="boulevardWipe"
      note="The 40-foot boulevard as a section break: a centre-line draws across the page. In reveal mode the line leads and the content is uncovered behind it."
    >
      <Row>
        <LabButton onClick={() => play("ltr")}>Replay left to right</LabButton>
        <LabButton onClick={() => play("rtl")}>Replay right to left</LabButton>
      </Row>
      <div
        ref={lineRef}
        className="h-0.5 w-full"
        style={{ background: "repeating-linear-gradient(90deg, var(--ink) 0 22px, transparent 22px 36px)" }}
      />
      <div ref={blockRef} className="relative max-w-2xl pt-6">
        <span data-wipe-line="" aria-hidden="true" className="absolute inset-x-0 top-0 block h-px bg-brick" />
        <div data-wipe-content="" className="space-y-2">
          <p className="font-display text-3xl text-ink">A section that arrives behind the line.</p>
          <p className="text-sm text-ink-muted">The clip opens from the same side the line travels from.</p>
        </div>
      </div>
    </LabSection>
  );
}
