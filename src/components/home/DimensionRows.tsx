/**
 * The unit counts as CAD dimension lines. Each line's length is its share of the total, so the drawing carries the
 * proportions as well as the figures. Static: final values are in the markup. Hooks for the S7 dimensionCount
 * primitive: every <li data-dimension data-value> holds one <svg> with [data-dim-line], two [data-dim-tick] and
 * [data-dim-ext] lines, and the value in <span data-dim-output>. Only confirmed counts are shown (project content).
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
  /** CSS colour of the dimension line. */
  color: string;
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

function DimensionLine({ color }: { color: string }) {
  return (
    <svg className="block h-4 w-full overflow-visible" aria-hidden="true" focusable="false" style={{ color }}>
      <g stroke="currentColor" strokeWidth={1} fill="none" shapeRendering="crispEdges">
        <line data-dim-ext="" x1="0.5" y1="0" x2="0.5" y2="16" opacity="0.55" />
        <svg x="100%" y="0" overflow="visible">
          <line data-dim-ext="" x1="-0.5" y1="0" x2="-0.5" y2="16" opacity="0.55" />
        </svg>
        <line data-dim-line="" x1="0" y1="8.5" x2="100%" y2="8.5" strokeWidth={1.5} />
      </g>
      <g stroke="var(--ink)" strokeWidth={1.5} fill="none">
        <line data-dim-tick="" x1="-4.5" y1="12.5" x2="5.5" y2="2.5" />
        <svg x="100%" y="0" overflow="visible">
          <line data-dim-tick="" x1="-5.5" y1="12.5" x2="4.5" y2="2.5" />
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
      ? "text-[clamp(3.5rem,2rem+6.2vw,7rem)]"
      : "text-[clamp(3rem,2rem+4vw,5rem)]";

  return (
    <ul className="m-0 grid list-none gap-9 p-0 md:gap-11" aria-label={label}>
      {rows.map((row) => {
        const share = (row.value / total) * 100;
        const isTotal = row.id === "total";
        return (
          <CountedItem
            key={row.id}
            value={row.value}
            className={isTotal ? "border-t border-line-strong pt-7 md:pt-9" : undefined}
          >
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <span
                data-dim-output=""
                className={`font-display ${numeral} leading-[0.9] tracking-[-0.03em] text-ink [font-variant-numeric:lining-nums_tabular-nums]`}
              >
                {formatCount(row.value)}
              </span>
              <span className="t-mono flex items-center gap-2.5 text-ink">
                <span aria-hidden="true" className="inline-block size-3 border border-line-strong" style={{ background: row.color } as CSSProperties} />
                {row.label}
              </span>
            </div>
            <div className="mt-3" style={{ width: `${share}%`, minWidth: "2.5rem" }}>
              <DimensionLine color={row.color} />
            </div>
          </CountedItem>
        );
      })}
    </ul>
  );
}
