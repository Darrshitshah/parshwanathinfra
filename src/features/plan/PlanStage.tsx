"use client";

/**
 * The stage: one SVG on the render grid with a single camera group, the optional photo layers under the line
 * drawing, and the HTML furniture over it (hotspots, lens control, north arrow and scale bar). Panning, zooming
 * and the scroll story all move the camera store; the group's transform follows it directly.
 */
import { forwardRef, useLayoutEffect, useRef } from "react";
import type { Chapter } from "@/content/schema";
import { fitBox, transformAttr, visibleBox } from "./camera";
import type { CameraStore } from "./camera-store";
import { Hotspots, type ChapterHotspot } from "./Hotspots";
import { LensControl } from "./LensControl";
import { PlanDrawing, PlotLabels } from "./PlanDrawing";
import { PlanOverlays } from "./PlanOverlays";
import { planStrings } from "./strings";
import { LensTiles, PhotoTiles, type LensHandle, type TileQuality } from "./TileLayers";
import { useMotionEffect } from "@/motion/hooks";

export interface PlanStageProps {
  store: CameraStore;
  chapters: readonly Chapter[];
  visibleChapterId: string | null;
  onHotspot: (hotspot: ChapterHotspot, chapter: Chapter) => void;
  quality: TileQuality;
  lensOn: boolean;
  lensRadius: number;
  /** The pointer is a mouse: the lens follows it. */
  lensFollows: boolean;
  photoOn: boolean;
  /** Plot numbers are large enough to read. */
  showNumbers: boolean;
  /** One-time ink draw-in of the boundary and roads. */
  drawIn: boolean;
  /** CSS cursor / interaction state: the plan can be dragged. */
  draggable: boolean;
  /** Reduced touch scroll takeover: the stage lets vertical page scroll through until movement is switched on. */
  touchScrolls: boolean;
}

export const PlanStage = forwardRef<HTMLDivElement, PlanStageProps>(function PlanStage(props, forwardedRef) {
  const { store, chapters, visibleChapterId, onHotspot, quality, lensOn, lensRadius, lensFollows, photoOn, showNumbers, drawIn, draggable, touchScrolls } = props;
  const localRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<SVGGElement>(null);
  const lensRef = useRef<LensHandle | null>(null);

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  // Size: measure the stage, keep what the camera is looking at when it changes (rotation, resize).
  useLayoutEffect(() => {
    const element = localRef.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const next = { w: Math.round(rect.width), h: Math.round(rect.height) };
      const previous = store.getSize();
      if (next.w === previous.w && next.h === previous.h) return;
      const looking = visibleBox(store.get(), previous);
      store.setSize(next);
      store.set(fitBox(looking, next));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [store]);

  // Camera: the group's transform follows the store.
  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const apply = () => {
      const cam = store.get();
      group.setAttribute("transform", transformAttr(cam, store.getSize()));
      group.style.setProperty("--lp-inv", String(1 / cam.s));
    };
    apply();
    return store.subscribe(apply);
  }, [store]);

  // One-time ink draw-in of the boundary and roads, the first time the plan scrolls into view.
  useMotionEffect(groupRef, drawIn, "ink", ({ gsap, ScrollTrigger, inkDraw }, group) => {
    const ink = group.querySelector<SVGGElement>("[data-ink]");
    const stage = group.closest(".lp-stage");
    if (!ink || !stage) return;
    const shapes = Array.from(ink.querySelectorAll("path"));
    const timeline = inkDraw(ink, { paused: true, duration: 2.4, stagger: 0.05 });
    timeline.eventCallback("onComplete", () => {
      // Non-scaling strokes must not keep a dash pattern, or they would break up as the camera zooms.
      gsap.set(shapes, { clearProps: "strokeDasharray,strokeDashoffset" });
    });
    const trigger = ScrollTrigger.create({ trigger: stage, start: "top 85%", once: true, onEnter: () => void timeline.play() });
    return () => {
      trigger.kill();
      timeline.kill();
      gsap.set(shapes, { clearProps: "strokeDasharray,strokeDashoffset" });
    };
  });

  return (
    <div
      ref={setRefs}
      className="lp-stage"
      tabIndex={0}
      role="group"
      aria-roledescription="interactive plan"
      aria-label={planStrings.stageLabel}
      data-draggable={draggable ? "true" : "false"}
      data-cursor-label={draggable ? "Drag" : "Explore"}
      data-touch-scrolls={touchScrolls ? "true" : "false"}
    >
      <svg className="lp-svg" width="100%" height="100%" aria-hidden="true" focusable="false">
        <g ref={groupRef} className="lp-cam">
          {photoOn ? <PhotoTiles store={store} quality={quality} /> : null}
          {lensOn ? <LensTiles store={store} radiusPx={lensRadius} quality={quality} handleRef={lensRef} /> : null}
          <PlanDrawing />
          <PlotLabels visible={showNumbers} />
        </g>
      </svg>
      <PlanOverlays store={store} />
      <Hotspots store={store} chapters={chapters} visibleChapterId={visibleChapterId} onActivate={onHotspot} />
      {lensOn ? <LensControl store={store} stageRef={localRef} lensRef={lensRef} radiusPx={lensRadius} follow={lensFollows} /> : null}
      {lensOn || photoOn ? <span className="lp-tag">{planStrings.lensCaption}</span> : null}
    </div>
  );
});
