"use client";

/**
 * <LivingPlan mode="story" | "explore">: S3, the signature moment. One vector stage built from plan.json.
 *
 *  - story: a pinned scroll that moves a camera through the six chapters (Tier A and B). On Tier C and with reduced
 *    motion nothing is pinned: the same stage is a static, interactive drawing with the chapters as a list.
 *  - explore: the free plan (wheel, pinch, buttons, arrow keys), chapter chips, plot picker, reality lens.
 * Both share the typology filter (keys 1 to 4), the unit-mix bar, the plot card, the building explorer and the
 * accessible list. Load it on demand (see LivingPlanSlot): it is not part of any route's initial JavaScript.
 */
import "./plan.css";
import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { plan, plotByNumber } from "@/content/plan";
import { chapters } from "@/content/plan/chapters";
import { cn } from "@/components/ui/cn";
import { useDeviceTier } from "@/lib/device-tier-provider";
import { camLimits, fitBox, keyToCommand, panBy, polygonBox, zoomAt, FALLBACK_SIZE } from "./camera";
import { CameraStore, useCameraSelector } from "./camera-store";
import { plotNumbersVisible } from "./plot-metrics";
import { ChapterCard, ChapterChips, ChapterList } from "./ChapterPanel";
import { activeFilter, filterReducer, FILTERS, INITIAL_FILTER, isFilterKey } from "./filter-state";
import { FilterControls } from "./FilterControls";
import { parseRef } from "./plan-refs";
import { PlanStage } from "./PlanStage";
import { PlotJump } from "./PlotJump";
import { PlanTwin } from "./PlanTwin";
import { PlotCard } from "./PlotCard";
import { planStrings } from "./strings";
import { tileManifest } from "./tiles";
import { Toolbar } from "./Toolbar";
import type { StoryPhase } from "./story";
import { useCameraMotion } from "./use-camera-motion";
import { useStageGestures } from "./use-stage-gestures";
import { useStory } from "./use-story";
import type { ChapterHotspot } from "./Hotspots";
import type { Chapter } from "@/content/schema";

const BoundsBox = plan.grid.viewBox;
const ExplorerDialog = lazy(() => import("@/features/explorer/BuildingExplorerDialog").then((module) => ({ default: module.BuildingExplorerDialog })));

const LENS_RADIUS_FINE = 88;
const LENS_RADIUS_TOUCH = 58;
const CHAPTER_MARGIN_PX = 14;
const PLOT_FOCUS_SPAN = 260;

export interface LivingPlanProps {
  mode?: "story" | "explore";
  className?: string;
}

function isTextEntry(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element || !element.tagName) return false;
  return element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT" || element.isContentEditable;
}

function typologyOf(node: EventTarget | null, root: HTMLElement | null): string | null {
  const element = (node as Element | null)?.closest?.("[data-t]") as HTMLElement | null;
  return element && root?.contains(element) ? (element.dataset.t ?? null) : null;
}

export function LivingPlan({ mode = "story", className }: LivingPlanProps) {
  const { tier, ready, reducedMotion, finePointer } = useDeviceTier();
  const motionOk = ready && tier !== "C" && !reducedMotion;
  const [exploring, setExploring] = useState(mode === "explore");
  const storyActive = mode === "story" && !exploring && motionOk;
  const staticStory = mode === "story" && !exploring && !storyActive;
  const free = !storyActive;

  const [store] = useState(() => new CameraStore(fitBox(BoundsBox, FALLBACK_SIZE)));
  const [filter, dispatch] = useReducer(filterReducer, INITIAL_FILTER);
  const active = activeFilter(filter);

  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const twinRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<StoryPhase>({ card: -1, spots: null });
  const [pickedChapter, setPickedChapter] = useState<number | null>(null);
  const [plotNumber, setPlotNumber] = useState<number | null>(null);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [twinShown, setTwinShown] = useState(false);
  const [lensChoice, setLensChoice] = useState<boolean | null>(null);
  const [photoOn, setPhotoOn] = useState(false);
  const [moveOn, setMoveOn] = useState(false);
  const [engaged, setEngaged] = useState(false);

  const motion = useCameraMotion(store, motionOk);
  const numbersVisible = useCameraSelector(store, (cam, size) => plotNumbersVisible(cam, size, BoundsBox));

  // The lens is on by default for a mouse on a capable device, until the visitor chooses.
  const lensOn = lensChoice ?? (ready && tier === "A" && finePointer);

  const quality = useMemo(() => {
    const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    return tier === "A" ? { dpr: Math.min(dpr, 2), maxZ: tileManifest.maxZ } : { dpr: 1, maxZ: Math.min(2, tileManifest.maxZ) };
  }, [tier]);

  const gesturesOn = free && (finePointer || moveOn);
  const gestures = useStageGestures(stageRef, { store, bounds: BoundsBox, enabled: gesturesOn, wheelAlways: engaged, onStart: motion.stop });

  useStory({
    pinRef,
    enabled: storyActive,
    tier: tier === "A" ? "A" : "B",
    store,
    chapters,
    onPhase: (next) => setPhase((previous) => (previous.card === next.card && previous.spots === next.spots ? previous : next)),
  });

  // Leaving the pinned story: put the camera back on the whole plan.
  useEffect(() => {
    if (!storyActive && mode === "story") {
      store.set(fitBox(BoundsBox, store.getSize()));
    }
  }, [storyActive, mode, store]);

  const spotChapter = storyActive ? phase.spots : pickedChapter;
  const visibleChapterId = spotChapter !== null && spotChapter >= 0 ? (chapters[spotChapter]?.id ?? null) : null;

  /* ---- camera helpers ---- */
  const goToChapter = useCallback(
    (index: number) => {
      const chapter = chapters[index];
      if (!chapter) return;
      setPickedChapter(index);
      motion.flyTo(fitBox(chapter.view, store.getSize(), CHAPTER_MARGIN_PX), 1.2);
    },
    [motion, store],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const size = store.getSize();
      motion.flyTo(zoomAt(store.get(), size, size.w / 2, size.h / 2, factor, BoundsBox, camLimits(BoundsBox, size)), 0.35);
    },
    [motion, store],
  );

  const resetCamera = useCallback(() => {
    setPickedChapter(null);
    motion.flyTo(fitBox(BoundsBox, store.getSize()), 0.8);
  }, [motion, store]);

  const openPlot = useCallback(
    (number: number, fly: boolean) => {
      const plot = plotByNumber(number);
      if (!plot) return false;
      setPlotNumber(number);
      if (fly && free) {
        const [x, y, w, h] = polygonBox(plot.polygon);
        const span = PLOT_FOCUS_SPAN;
        const target = fitBox([x + w / 2 - span / 2, y + h / 2 - (span * 0.55) / 2, span, span * 0.55], store.getSize());
        const current = store.get();
        motion.flyTo(target.s > current.s ? target : { ...current, cx: target.cx, cy: target.cy }, 1);
      }
      return true;
    },
    [free, motion, store],
  );

  const onHotspot = useCallback(
    (hotspot: ChapterHotspot, chapter: Chapter) => {
      void chapter;
      const target = parseRef(hotspot.ref);
      if (target.kind === "plot") openPlot(target.number, true);
      else if (target.kind === "building" && target.explorable) setBuildingId(target.id);
      else if (target.kind === "building" && isFilterKey(target.typology)) dispatch({ type: "tap", key: target.typology });
      else if (free) {
        const current = store.get();
        const limits = camLimits(BoundsBox, store.getSize());
        motion.flyTo({ cx: hotspot.point[0], cy: hotspot.point[1], s: Math.min(Math.max(current.s, limits.min * 3), limits.max) }, 0.9);
      }
    },
    [free, motion, openPlot, store],
  );

  const showTwin = useCallback(() => {
    setTwinShown(true);
    requestAnimationFrame(() => twinRef.current?.focus({ preventScroll: false }));
  }, []);

  /* ---- delegated highlight, pin and pick (the pjLink behaviour) ---- */
  const onPointerOver = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    const t = typologyOf(event.target, rootRef.current);
    if (t && isFilterKey(t)) dispatch({ type: "hover", key: t });
  };
  const onPointerOut = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    if (!typologyOf(event.relatedTarget, rootRef.current)) dispatch({ type: "unhover" });
  };
  const onFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest?.("button[data-t]") as HTMLElement | null;
    if (!button) return;
    let visible = false;
    try {
      visible = button.matches(":focus-visible");
    } catch {
      visible = true;
    }
    const t = button.dataset.t;
    if (visible && t && isFilterKey(t)) dispatch({ type: "hover", key: t });
  };
  const onBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest?.("button[data-t]")) dispatch({ type: "unhover" });
  };
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (gestures.justDragged()) return;
    const target = event.target as Element;
    const plotEl = target.closest?.("[data-plot]") as HTMLElement | null;
    if (plotEl && rootRef.current?.contains(plotEl)) {
      openPlot(Number(plotEl.dataset.plot), false);
      return;
    }
    const buildingEl = target.closest?.("[data-building]") as HTMLElement | null;
    if (buildingEl && rootRef.current?.contains(buildingEl)) {
      const id = buildingEl.dataset.building;
      const found = id ? parseRef(`b-${id}`) : null;
      if (found && found.kind === "building" && found.explorable) {
        setBuildingId(found.id);
        return;
      }
    }
    const t = typologyOf(event.target, rootRef.current);
    if (t && isFilterKey(t)) {
      dispatch({ type: "tap", key: t });
      return;
    }
    if (target.closest?.(".lp-stage") && !target.closest?.("[data-no-pan]")) dispatch({ type: "emptyClick" });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!rootRef.current?.contains(event.target as Node) || isTextEntry(event.target)) return;
    const command = keyToCommand(event.key, { ctrl: event.ctrlKey, meta: event.metaKey, alt: event.altKey });
    if (!command) return;
    const onStage = event.target === stageRef.current;
    switch (command.type) {
      case "digit":
        dispatch({ type: "digit", digit: command.digit });
        break;
      case "clear":
        if (plotNumber !== null) setPlotNumber(null);
        dispatch({ type: "clear" });
        break;
      case "pan":
        if (onStage && free) {
          event.preventDefault();
          motion.stop();
          const size = store.getSize();
          store.set(panBy(store.get(), command.dx, command.dy, BoundsBox, camLimits(BoundsBox, size)));
        }
        break;
      case "zoom":
        if (onStage && free) {
          event.preventDefault();
          zoomBy(command.factor);
        }
        break;
      case "reset":
        if (onStage && free) {
          event.preventDefault();
          resetCamera();
        }
        break;
    }
  };

  const modeAction =
    mode === "story" && motionOk
      ? exploring
        ? { label: planStrings.backToStory, onClick: () => setExploring(false) }
        : {
            label: planStrings.explore,
            onClick: () => {
              setExploring(true);
              rootRef.current?.scrollIntoView({ block: "start" });
            },
          }
      : null;

  const hint =
    visibleChapterId === "row-houses" && !numbersVisible
      ? planStrings.hints.zoomForPlots
      : finePointer
        ? planStrings.hints.wheel
        : moveOn
          ? planStrings.hints.pinch
          : "";
  const activeLabel = active ? (FILTERS.find((entry) => entry.key === active)?.short ?? "") : "";

  return (
    <div
      ref={rootRef}
      className={cn("lp", className)}
      role="region"
      aria-label={planStrings.eyebrow}
      data-mode={mode}
      data-story={storyActive ? "on" : "off"}
      data-active={active ?? ""}
      data-tier={tier}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <a
        className="lp-skip"
        href="#lp-twin"
        onClick={(event) => {
          event.preventDefault();
          showTwin();
        }}
      >
        {planStrings.skipToList}
      </a>
      <p className="sr-only" aria-live="polite">
        {activeLabel}
      </p>

      <div className="lp-pin-host">
        <span className="lp-header-probe" aria-hidden="true" />
        <div ref={pinRef} className="lp-pin">
          <div className="lp-panel">
            <div className="lp-top">
              <FilterControls pinned={filter.pin} />
              <Toolbar
                free={free}
                lensAvailable={ready && tier !== "C"}
                lensOn={lensOn}
                onLens={() => setLensChoice(!lensOn)}
                photoAvailable={ready && tier === "C"}
                photoOn={photoOn}
                onPhoto={() => setPhotoOn((value) => !value)}
                showMove={!finePointer && free}
                moveOn={moveOn}
                onMove={() => setMoveOn((value) => !value)}
                onZoom={zoomBy}
                onReset={resetCamera}
                twinShown={twinShown}
                onTwin={() => (twinShown ? setTwinShown(false) : showTwin())}
                modeAction={modeAction}
              />
            </div>

            <div className="lp-stage-wrap" hidden={twinShown}>
              <div onFocus={() => setEngaged(true)} onBlur={() => setEngaged(false)} className="lp-stage-focus" data-gestures={gesturesOn ? "on" : "off"}>
                <PlanStage
                  ref={stageRef}
                  store={store}
                  chapters={chapters}
                  visibleChapterId={visibleChapterId}
                  onHotspot={onHotspot}
                  quality={quality}
                  lensOn={lensOn && ready && tier !== "C"}
                  lensRadius={finePointer ? LENS_RADIUS_FINE : LENS_RADIUS_TOUCH}
                  lensFollows={finePointer}
                  photoOn={photoOn && tier === "C"}
                  showNumbers={numbersVisible}
                  drawIn={motionOk}
                  draggable={gesturesOn}
                  touchScrolls={!gesturesOn}
                />
              </div>
              {storyActive ? <ChapterCard chapters={chapters} index={phase.card} /> : null}
              {plotNumber !== null && !twinShown ? <PlotCard number={plotNumber} onClose={() => setPlotNumber(null)} /> : null}
              {free ? <p className="lp-hint">{hint}</p> : null}
            </div>
          </div>
        </div>
      </div>

      {free && !staticStory ? (
        <div className="lp-under">
          <ChapterChips chapters={chapters} activeId={visibleChapterId} onSelect={goToChapter} />
          <PlotJump onGoToPlot={(number) => openPlot(number, true)} />
        </div>
      ) : null}
      {staticStory ? <ChapterList chapters={chapters} activeId={visibleChapterId} onSelect={goToChapter} /> : null}

      {plotNumber !== null && twinShown ? <PlotCard inline number={plotNumber} onClose={() => setPlotNumber(null)} /> : null}
      <PlanTwin ref={twinRef} shown={twinShown} onOpenBuilding={setBuildingId} onOpenPlot={(number) => openPlot(number, false)} />

      {buildingId ? (
        <Suspense fallback={null}>
          <ExplorerDialog buildingId={buildingId} onClose={() => setBuildingId(null)} />
        </Suspense>
      ) : null}
    </div>
  );
}
