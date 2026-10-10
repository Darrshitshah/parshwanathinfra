"use client";

import { useEffect, useRef, useState } from "react";
import { dimensionCount, type Timeline } from "@/motion";
import { Chip, LabButton, LabSection, Row, useLab } from "./lab-ui";

// 1,250 flats, 165 row houses and 1,565 in total are the unit mix in the build spec; 1250000 only shows the grouping.
const VALUES: Array<{ value: number; label: string }> = [
  { value: 165, label: "165" },
  { value: 1250, label: "1,250" },
  { value: 1565, label: "1,565" },
  { value: 1250000, label: "1250000 (grouping demo)" },
];

export function DimensionSection() {
  const { reduced } = useLab();
  const [value, setValue] = useState(1565);
  const lineRef = useRef<SVGLineElement>(null);
  const startTickRef = useRef<SVGLineElement>(null);
  const endTickRef = useRef<SVGLineElement>(null);
  const outputRef = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<Timeline | null>(null);

  const play = (next: number) => {
    const line = lineRef.current;
    const start = startTickRef.current;
    const end = endTickRef.current;
    const output = outputRef.current;
    if (!line || !start || !end || !output) return;
    timelineRef.current?.kill();
    setValue(next);
    timelineRef.current = dimensionCount({ line, ticks: [start, end], output }, { value: next, reduced });
  };

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  return (
    <LabSection
      id="dimension"
      title="dimensionCount"
      note="A dimension line with end ticks draws, then the number counts up inside it with Indian grouping (Intl.NumberFormat en-IN). Digits are tabular and the width is reserved, so nothing shifts while counting."
    >
      <Row>
        {VALUES.map((item) => (
          <LabButton key={item.value} onClick={() => play(item.value)}>
            {item.label}
          </LabButton>
        ))}
        <Chip>
          current: {value}
        </Chip>
      </Row>
      <div className="relative flex h-12 max-w-2xl items-center justify-center text-ink">
        <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" focusable="false">
          <line ref={startTickRef} x1="0.5" x2="0.5" y1="8" y2="40" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line ref={lineRef} x1="0" x2="100%" y1="24" y2="24" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line ref={endTickRef} x1="99.9%" x2="99.9%" y1="8" y2="40" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="relative grid bg-paper px-4 font-mono text-3xl tracking-tight tabular-nums">
          <span aria-hidden="true" className="invisible col-start-1 row-start-1">
            {value.toLocaleString("en-IN")}
          </span>
          <span ref={outputRef} className="col-start-1 row-start-1 text-center">
            1,565
          </span>
        </span>
      </div>
    </LabSection>
  );
}
