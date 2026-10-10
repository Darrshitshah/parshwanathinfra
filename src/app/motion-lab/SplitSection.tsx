"use client";

import { useEffect, useRef } from "react";
import { splitReveal, type SplitUnit } from "@/motion";
import { LabButton, LabSection, Row, useLab } from "./lab-ui";

const SAMPLES: Array<{ by: SplitUnit; text: string; className: string }> = [
  {
    by: "lines",
    text: "Planned neighbourhoods, drawn to life. Flats, row houses and shops in one planned township on the Vapi-Silvassa Road.",
    className: "max-w-xl font-display text-3xl leading-tight text-ink",
  },
  { by: "words", text: "Drawn to life, one line at a time.", className: "max-w-xl font-display text-4xl leading-tight text-ink" },
  { by: "chars", text: "Shiv Shiva Township", className: "font-display text-6xl leading-none text-ink" },
];

export function SplitSection() {
  const { reduced } = useLab();
  const refs = useRef<Record<SplitUnit, HTMLElement | null>>({ lines: null, words: null, chars: null });
  const reverts = useRef<Partial<Record<SplitUnit, () => void>>>({});

  const play = (by: SplitUnit) => {
    const element = refs.current[by];
    if (!element) return;
    reverts.current[by]?.();
    reverts.current[by] = splitReveal(element, { by, reduced, revertOnComplete: true }).revert;
  };

  useEffect(() => {
    const active = reverts.current;
    return () => {
      Object.values(active).forEach((revert) => revert?.());
    };
  }, []);

  return (
    <LabSection
      id="split"
      title="splitReveal"
      note="SplitText with line masks: lines, words or characters rise out of their line. The split re-runs on resize and when fonts load, and the original markup is restored when it finishes."
    >
      {SAMPLES.map((sample) => (
        <div key={sample.by} className="space-y-3">
          <Row>
            <LabButton onClick={() => play(sample.by)}>Replay by {sample.by}</LabButton>
          </Row>
          <p
            ref={(node) => {
              refs.current[sample.by] = node;
            }}
            className={sample.className}
          >
            {sample.text}
          </p>
        </div>
      ))}
    </LabSection>
  );
}
