"use client";

import Image from "next/image";
import { useEffect, useRef, type MouseEvent } from "react";
import { getMedia } from "@/content/media";
import { roundaboutIris, type Timeline } from "@/motion";
import { LabButton, LabSection, Row, useLab } from "./lab-ui";

export function IrisSection() {
  const { reduced } = useLab();
  const frameRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const picture = getMedia("masterplan-aerial");

  const play = (phase: "open" | "close", origin?: { x: number; y: number }) => {
    const frame = frameRef.current;
    if (!frame) return;
    timelineRef.current?.progress(1).kill();
    timelineRef.current = roundaboutIris(frame, { phase, origin, reduced });
  };

  const openFromClick = (event: MouseEvent<HTMLDivElement>) => play("open", { x: event.clientX, y: event.clientY });

  useEffect(() => {
    return () => {
      timelineRef.current?.progress(1).kill();
    };
  }, []);

  return (
    <LabSection
      id="iris"
      title="roundaboutIris"
      note="A circular iris cut from the roundabout. It opens or closes around a point in viewport pixels: click the picture to open it from exactly where you clicked."
    >
      <Row>
        <LabButton onClick={() => play("close")}>Close</LabButton>
        <LabButton onClick={() => play("open")}>Open from centre</LabButton>
      </Row>
      <div
        ref={frameRef}
        onClick={openFromClick}
        data-cursor-label="Open"
        className="relative aspect-3/2 max-w-2xl overflow-hidden bg-paper-sunk"
      >
        <Image src={picture.src} alt={picture.alt} fill sizes="(min-width: 768px) 672px, 100vw" className="object-cover" />
      </div>
      <p className="font-mono text-xs text-ink-muted">Artist&apos;s impression</p>
    </LabSection>
  );
}
