"use client";

import Image from "next/image";
import { useState } from "react";
import { plan } from "@/content/plan";
import { getMedia } from "@/content/media";
import { BoundaryLoader } from "@/components/loader";
import { worstCaseSeconds } from "@/components/loader";
import { shapeFromPlan } from "@/motion/township";
import { Chip, LabButton, LabSection, Row } from "./lab-ui";

interface Run {
  id: number;
  forceStatic: boolean;
}

/** The S1 loader on the real plan boundary. `persist={false}` so replaying never touches the session flag. */
export function LoaderSection() {
  const [run, setRun] = useState<Run | null>(null);
  const [finished, setFinished] = useState<string>("not played yet");
  const picture = getMedia("cover");

  const start = (forceStatic: boolean) => {
    setFinished("playing");
    setRun((previous) => ({ id: (previous?.id ?? 0) + 1, forceStatic }));
  };

  return (
    <LabSection
      id="loader"
      title="S1 loader · BoundaryLoader"
      note={
        <>
          The red township boundary draws with the roundabout dot and the entry arrow, then becomes a window onto the page
          and grows to full bleed. It does not wait for any asset: the picture below is already painting underneath. About{" "}
          {worstCaseSeconds().toFixed(1)} s in total. Replays here never set the session flag.
        </>
      }
    >
      <Row>
        <LabButton onClick={() => start(false)}>Play loader</LabButton>
        <LabButton onClick={() => start(true)}>Play Tier C fade</LabButton>
        <Chip>{finished}</Chip>
      </Row>
      <div className="relative aspect-3/2 max-w-md overflow-hidden bg-paper-sunk">
        <Image
          src={picture.src}
          alt={picture.alt}
          fill
          sizes="448px"
          className="object-cover"
          loading="eager"
        />
      </div>
      <p className="font-mono text-xs text-ink-muted">Artist&apos;s impression · this picture paints under the loader from the first frame</p>
      {run ? (
        <BoundaryLoader
          key={run.id}
          {...shapeFromPlan(plan)}
          persist={false}
          forceStatic={run.forceStatic}
          onDone={() => {
            setFinished("finished");
            setRun(null);
          }}
        />
      ) : null}
    </LabSection>
  );
}
