/**
 * A grid of labelled facts: a small tracked label above each value, no cells or rules. Values that are still "TBD" render as a
 * chip, so a gap in the data is obvious. Owner: pages-lead.
 */
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/components/ui/cn";

export interface Fact {
  label: string;
  value: ReactNode;
}

interface FactsBlockProps {
  facts: readonly Fact[];
  /** Columns from the md breakpoint up. */
  columns?: 1 | 2 | 3 | 4;
  className?: string;
  /** Accessible name when the block stands alone. */
  label?: string;
}

export function FactsBlock({ facts, columns = 2, className, label }: FactsBlockProps) {
  return (
    <dl className={cn("titleblock m-0", className)} style={{ "--tb-cols": columns } as CSSProperties} aria-label={label}>
      {facts.map((fact) => (
        <div key={fact.label} className="titleblock__cell">
          <dt className="titleblock__label">{fact.label}</dt>
          <dd className="titleblock__value m-0">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
