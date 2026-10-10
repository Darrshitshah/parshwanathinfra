"use client";

/**
 * Previous / next buttons for a horizontal scroller (the amenities track). They scroll the target element by most of
 * its visible width; users who prefer reduced motion get an instant jump. The scroller itself stays a plain
 * overflow container, so touch, trackpad, keyboard and shift-wheel all keep working. Owner: pages-lead.
 */
import { Icon } from "./Icon";

interface ScrollerControlsProps {
  /** id of the scrolling element. */
  targetId: string;
  previousLabel: string;
  nextLabel: string;
  className?: string;
}

const SCROLL_FRACTION = 0.8;

export function ScrollerControls({ targetId, previousLabel, nextLabel, className }: ScrollerControlsProps) {
  function scroll(direction: 1 | -1) {
    const track = document.getElementById(targetId);
    if (!track) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: direction * track.clientWidth * SCROLL_FRACTION, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <div className={className} role="group">
      <button type="button" className="btn-icon btn-icon--outlined" onClick={() => scroll(-1)} aria-label={previousLabel} aria-controls={targetId}>
        <Icon name="chevron-left" />
      </button>
      <button type="button" className="btn-icon btn-icon--outlined" onClick={() => scroll(1)} aria-label={nextLabel} aria-controls={targetId}>
        <Icon name="chevron-right" />
      </button>
    </div>
  );
}
