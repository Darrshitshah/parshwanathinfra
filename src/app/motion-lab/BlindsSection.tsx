"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getMedia } from "@/content/media";
import { stripBlinds, type Timeline } from "@/motion";
import { LabButton, LabSection, Row, useLab } from "./lab-ui";

const PICTURES = ["row-houses-day", "row-house-street", "row-house-wing"] as const;

export function BlindsSection() {
  const { reduced } = useLab();
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [strips, setStrips] = useState(12);
  const frames = useRef<Array<HTMLDivElement | null>>([]);
  const timelineRef = useRef<Timeline | null>(null);

  const play = () => {
    const elements = frames.current.filter((frame): frame is HTMLDivElement => frame !== null);
    timelineRef.current?.progress(1).kill();
    timelineRef.current = stripBlinds(elements, { strips, orientation, reduced });
  };

  useEffect(() => {
    return () => {
      timelineRef.current?.progress(1).kill();
    };
  }, []);

  return (
    <LabSection
      id="blinds"
      title="stripBlinds"
      note="Row-house strips as blinds: each picture is cut into slats that open from their centre line, one after another. It animates a clip-path on the picture itself, so there are no overlay boxes."
    >
      <Row>
        <LabButton onClick={play}>Replay</LabButton>
        <LabButton onClick={() => setOrientation((current) => (current === "vertical" ? "horizontal" : "vertical"))}>
          Orientation: {orientation}
        </LabButton>
        <LabButton onClick={() => setStrips((current) => (current === 12 ? 6 : current === 6 ? 24 : 12))}>Strips: {strips}</LabButton>
      </Row>
      <div className="grid gap-4 sm:grid-cols-3">
        {PICTURES.map((id, index) => {
          const picture = getMedia(id);
          return (
            <figure key={id} className="space-y-2">
              <div
                ref={(node) => {
                  frames.current[index] = node;
                }}
                className="relative aspect-4/5 overflow-hidden bg-paper-sunk"
              >
                <Image src={picture.src} alt={picture.alt} fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
              </div>
              <figcaption className="font-mono text-xs text-ink-muted">Artist&apos;s impression</figcaption>
            </figure>
          );
        })}
      </div>
    </LabSection>
  );
}
