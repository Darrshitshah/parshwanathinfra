/**
 * Section helpers. Every section has an id, a heading that labels it, and (where a Phase 2 experience mounts)
 * a data-slot attribute. Eyebrow is the mono drawing annotation: a numbered detail marker, a label, a ruled line
 * and an optional right-hand note.
 */
import type { ElementType, ReactNode } from "react";
import { cn } from "./cn";

interface SectionProps {
  id: string;
  /** Marks where a Phase 2 experience mounts (for example "living-plan"). */
  slot?: string;
  /** id of the heading that labels the section. Defaults to `${id}-title`. */
  labelledBy?: string;
  className?: string;
  children: ReactNode;
  /** Remove the standard vertical padding (for full-bleed or custom spacing). */
  flush?: boolean;
  as?: ElementType;
}

export function Section({ id, slot, labelledBy, className, children, flush = false, as: Tag = "section" }: SectionProps) {
  return (
    <Tag
      id={id}
      data-slot={slot}
      aria-labelledby={labelledBy ?? `${id}-title`}
      className={cn(!flush && "section-pad", className)}
    >
      {children}
    </Tag>
  );
}

interface EyebrowProps {
  /** Two-digit detail marker, for example "02". */
  index?: string;
  children: ReactNode;
  note?: ReactNode;
  className?: string;
}

export function Eyebrow({ index, children, note, className }: EyebrowProps) {
  return (
    <p className={cn("eyebrow t-mono", className)}>
      {index ? (
        <span className="eyebrow__marker" aria-hidden="true">
          {index}
        </span>
      ) : null}
      <span className="eyebrow__label">{children}</span>
      <span className="eyebrow__rule" aria-hidden="true" />
      {note ? <span className="eyebrow__note">{note}</span> : null}
    </p>
  );
}

interface HeadingProps {
  id: string;
  level?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
}

/** Display-serif heading with a stable id so the section can reference it. */
export function DisplayHeading({ id, level = 2, className, children }: HeadingProps) {
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  return (
    <Tag id={id} className={cn("t-display-2 text-ink", className)}>
      {children}
    </Tag>
  );
}
