/**
 * The frame around the location map, shared by the schematic (server render and fallback) and the live street map.
 * A rounded sheet holds the map; our glass info card sits over its bottom-left corner from md up and under it on
 * phones, clear of the map controls (top-right) and the map credit (bottom-right). `data-state` is "fallback" or "live".
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
