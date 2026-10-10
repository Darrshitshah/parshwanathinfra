"use client";

/** Chapter text: the pinned story's card, the chapter chips of the free plan, and the static list for Tier C. */
import type { Chapter } from "@/content/schema";
import { cn } from "@/components/ui/cn";
import { planStrings } from "./strings";

const pad = (n: number) => String(n).padStart(2, "0");

interface CardProps {
  chapters: readonly Chapter[];
  /** -1 is the intro. */
  index: number;
}

/** The card laid over the pinned stage. */
export function ChapterCard({ chapters, index }: CardProps) {
  const chapter = index >= 0 ? chapters[index] : undefined;
  return (
    <div className="lp-chapter" data-no-pan="">
      <p className="lp-chapter__n">{chapter ? `${pad(chapter.index)} / ${pad(chapters.length)}` : planStrings.eyebrow}</p>
      <h3 className="lp-chapter__title">{chapter ? chapter.title : planStrings.intro.title}</h3>
      <p className="lp-chapter__body">{chapter ? chapter.body : planStrings.intro.body}</p>
      <ol className="lp-dots" aria-hidden="true">
        {chapters.map((c, i) => (
          <li key={c.id} className={cn(i === index && "is-on", i < index && "is-done")} />
        ))}
      </ol>
    </div>
  );
}

interface ChipsProps {
  chapters: readonly Chapter[];
  activeId: string | null;
  onSelect: (index: number) => void;
}

/** Chapter shortcuts for the free plan. */
export function ChapterChips({ chapters, activeId, onSelect }: ChipsProps) {
  return (
    <nav className="lp-chips" aria-label={planStrings.chapterNav} data-no-pan="">
      {chapters.map((chapter, index) => (
        <button key={chapter.id} type="button" className="lp-chip" aria-pressed={chapter.id === activeId} onClick={() => onSelect(index)}>
          <span className="lp-chip__n" aria-hidden="true">
            {pad(chapter.index)}
          </span>
          {chapter.title}
        </button>
      ))}
    </nav>
  );
}

/** Tier C and reduced motion: no pinning, the chapters are a list with a button that shows each on the plan. */
export function ChapterList({ chapters, activeId, onSelect }: ChipsProps) {
  return (
    <ol className="lp-chapter-list">
      {chapters.map((chapter, index) => (
        <li key={chapter.id} className={cn("lp-chapter-list__item", chapter.id === activeId && "is-on")}>
          <p className="lp-chapter__n">{`${pad(chapter.index)} / ${pad(chapters.length)}`}</p>
          <h3 className="lp-chapter__title">{chapter.title}</h3>
          <p className="lp-chapter__body">{chapter.body}</p>
          <button type="button" className="lp-link" aria-pressed={chapter.id === activeId} onClick={() => onSelect(index)}>
            {planStrings.chapterButton} <span className="sr-only">{chapter.title}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
