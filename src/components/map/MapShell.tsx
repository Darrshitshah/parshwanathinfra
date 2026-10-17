/**
 * The frame around the location map, shared by the static fallback (server) and the live Google map (client).
 * A rounded sheet holds the map; our glass info card sits over its corner from md up and under it on phones, so it
 * never covers Google's logo and attribution at the bottom of the frame. `data-state` is "fallback" or "live".
 * Owner: pages-lead.
 */
import type { ReactNode, Ref } from "react";
import { cn } from "@/components/ui/cn";

interface MapShellProps {
  state: "fallback" | "live";
  frame: ReactNode;
  card: ReactNode;
  caption: string;
  frameRef?: Ref<HTMLDivElement>;
  className?: string;
}

export function MapShell({ state, frame, card, caption, frameRef, className }: MapShellProps) {
  return (
    <figure className={cn("m-0", className)}>
      <div className="group/map relative" data-state={state} data-site-map>
        <div
          ref={frameRef}
          className="relative isolate aspect-[5/6] w-full overflow-hidden rounded-(--radius-card) bg-paper-sunk ring-1 ring-(--line) md:aspect-[600/440]"
        >
          {frame}
        </div>
        {card}
      </div>
      <figcaption className="t-small mt-4 text-ink-muted">{caption}</figcaption>
    </figure>
  );
}
