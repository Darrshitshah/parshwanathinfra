"use client";

import type { StageCaption } from "./captions";
import { dioramaStrings } from "./strings";

/** The label every view of the model carries. Heights are confirmed, so only the artist's impression note remains. */
export function StageBadges() {
  return (
    <p className="t-mono-sm pointer-events-none absolute bottom-3 right-3 m-0 rounded-sm bg-paper/85 px-2 py-1 text-ink-muted md:bottom-5 md:right-5">
      {dioramaStrings.impression}
    </p>
  );
}

interface CaptionCardProps {
  caption: StageCaption;
  index: number;
  total: number;
  onBuildingSelect?: (buildingId: string) => void;
}

/** Caption of the current station. Building hotspots are real buttons so the model is usable from the keyboard. */
export function CaptionCard({ caption, index, total, onBuildingSelect }: CaptionCardProps) {
  return (
    <div
      className="absolute inset-x-3 bottom-12 max-w-sm rounded-sm border border-line bg-paper-raised/92 p-4 text-ink md:inset-x-auto md:bottom-5 md:left-5 md:p-5"
      aria-live="polite"
    >
      <p className="t-mono-sm m-0 text-ink-muted">{dioramaStrings.stationCount(index + 1, total)}</p>
      <h3 className="t-display-4 m-0 mt-1">{caption.title}</h3>
      <p className="t-small m-0 mt-2 text-ink-muted">{caption.body}</p>
      {onBuildingSelect && caption.buildings.length > 0 ? (
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
          {caption.buildings.map((b) => (
            <li key={b.buildingId}>
              <button
                type="button"
                onClick={() => onBuildingSelect(b.buildingId)}
                className="t-mono-sm cursor-pointer rounded-sm border border-line-strong bg-paper px-2 py-1 text-ink hover:bg-paper-sunk focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label={`${dioramaStrings.openInPlan}: ${b.label}`}
              >
                {b.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** All chapters as plain text, always in the DOM for screen readers and search. */
export function ChapterTextList({ captions }: { captions: ReadonlyArray<StageCaption> }) {
  return (
    <ol className="sr-only" aria-label={dioramaStrings.chapterList}>
      {captions.map((c) => (
        <li key={c.id}>
          <h3>{c.title}</h3>
          <p>{c.body}</p>
        </li>
      ))}
    </ol>
  );
}
