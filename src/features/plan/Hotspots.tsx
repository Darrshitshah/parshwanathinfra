"use client";

/**
 * Chapter hotspots as real buttons over the stage. Positions come from the chapter data (grid points resolved from
 * plan.json) and are written straight to each button's transform on every camera change, so they stay glued to the
 * plan without React rendering per frame. Only the visible chapter's hotspots can be reached with Tab.
 */
import { useEffect, useRef } from "react";
import type { Chapter } from "@/content/schema";
import { Tbd } from "@/components/ui/Tbd";
import { gridToScreen } from "./camera";
import type { CameraStore } from "./camera-store";

const FLIP_MARGIN_PX = 190;

export type ChapterHotspot = Chapter["hotspots"][number];

interface HotspotsProps {
  store: CameraStore;
  chapters: readonly Chapter[];
  /** The chapter whose hotspots show, or null. */
  visibleChapterId: string | null;
  onActivate: (hotspot: ChapterHotspot, chapter: Chapter) => void;
}

export function Hotspots({ store, chapters, visibleChapterId, onActivate }: HotspotsProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-gx]")).map((el) => ({
      el,
      gx: Number(el.dataset.gx),
      gy: Number(el.dataset.gy),
      chapter: el.dataset.chapter,
    }));
    let frame = 0;
    const update = () => {
      frame = 0;
      const cam = store.get();
      const size = store.getSize();
      for (const item of items) {
        if (item.chapter !== visibleChapterId) continue;
        const [x, y] = gridToScreen(cam, size, item.gx, item.gy);
        item.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        item.el.dataset.side = x > size.w - FLIP_MARGIN_PX ? "left" : "right";
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    const unsubscribe = store.subscribe(schedule);
    return () => {
      unsubscribe();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [store, visibleChapterId]);

  return (
    <div ref={rootRef} className="lp-hotspots" data-no-pan="">
      {chapters.map((chapter) =>
        chapter.hotspots.map((hotspot) => {
          const on = chapter.id === visibleChapterId;
          return (
            <button
              key={`${chapter.id}:${hotspot.id}`}
              type="button"
              className="lp-hotspot"
              data-on={on ? "true" : "false"}
              data-chapter={chapter.id}
              data-gx={hotspot.point[0]}
              data-gy={hotspot.point[1]}
              data-side="right"
              tabIndex={on ? 0 : -1}
              onClick={() => onActivate(hotspot, chapter)}
            >
              <span className="lp-hotspot__dot" aria-hidden="true" />
              <span className="lp-hotspot__label">
                {hotspot.label}
                {hotspot.labelTbd ? <Tbd className="ml-2" /> : null}
              </span>
            </button>
          );
        }),
      )}
    </div>
  );
}
