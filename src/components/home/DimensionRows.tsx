/**
 * The unit counts as big numerals, each with a bar whose length is its share of the total, so the section carries the
 * proportions as well as the figures. Static: final values are in the markup. Hooks for the S7 dimensionCount
 * primitive: every <li data-dimension data-value> holds one <svg> with [data-dim-line] and two [data-dim-tick]
 * beads, and the value in <span data-dim-output>. Only confirmed counts are shown (project content).
 * Used by the Home "numbers" section and the project overview. Owner: pages-lead.
 */
import type { CSSProperties } from "react";
import { en } from "@/content/i18n/en";
import { shivShiva } from "@/content/projects";
import { CountedItem } from "./CountedItem";

interface DimensionRow {
  id: "flats" | "rowhouses" | "shops" | "total";
  label: string;
  value: number;
  /** CSS colour of the share bar. */
  color: string;
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

/**
 * The share bar: a round-capped line in the typology colour with a bead at each end. The hooks (line and the two
 * ticks) are the ones the count-up animates: the line draws, the beads land as it reaches them.
 */
function DimensionLine({ color }: { color: string }) {
  return (
    <svg className="block h-3 w-full overflow-visible" aria-hidden="true" focusable="false" style={{ color }}>
      <g stroke="currentColor" fill="none">
        <line data-dim-line="" x1="6" y1="6" x2="100%" y2="6" strokeWidth={5} strokeLinecap="round" />
      </g>
      <g stroke="currentColor" fill="none" strokeLinecap="round">
        <line data-dim-tick="" x1="6" y1="6" x2="6" y2="6" strokeWidth={12} />
        <svg x="100%" y="0" overflow="visible">
          <line data-dim-tick="" x1="-6" y1="6" x2="-6" y2="6" strokeWidth={12} />
        </svg>
      </g>
    </svg>
  );
}

interface DimensionRowsProps {
  /** Accessible name of the list. */
  label: string;
  /** "lg" is the Home scale; "md" is a little smaller for the project overview. */
  size?: "lg" | "md";
}

export function DimensionRows({ label, size = "lg" }: DimensionRowsProps) {
  const { flats, rowHouses, shops, total } = shivShiva.counts;
  const rows: DimensionRow[] = [
    { id: "flats", label: en.typology.flats, value: flats, color: "var(--type-flats)" },
    { id: "rowhouses", label: en.typology.rowhouses, value: rowHouses, color: "var(--type-rowhouses)" },
    { id: "shops", label: en.typology.shops, value: shops, color: "var(--type-shops)" },
    { id: "total", label: en.typology.total, value: total, color: "var(--ink)" },
  ];
  const numeral =
    size === "lg"
      ? "text-[clamp(4.25rem,2.4rem+8vw,9rem)]"
      : "text-[clamp(3.5rem,2.2rem+5vw,6rem)]";

  return (
    <ul className="m-0 grid list-none gap-10 p-0 md:gap-14" aria-label={label}>
      {rows.map((row) => {
        const share = (row.value / total) * 100;
        return (
          <CountedItem key={row.id} value={row.value}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span
                data-dim-output=""
                className={`font-display font-medium ${numeral} leading-[0.88] tracking-[-0.02em] text-ink [font-variant-numeric:lining-nums_tabular-nums]`}
              >
                {formatCount(row.value)}
              </span>
              <span className="t-mono flex items-center gap-3 text-ink">
                <span aria-hidden="true" className="inline-block size-2.5 rounded-full" style={{ background: row.color } as CSSProperties} />
                {row.label}
              </span>
            </div>
            <div className="mt-5" style={{ width: `${share}%`, minWidth: "3rem" }}>
              <DimensionLine color={row.color} />
            </div>
          </CountedItem>
        );
      })}
    </ul>
  );
}
