"use client";

/**
 * Pointer gestures on the stage: drag to pan, two fingers to pinch and pan, wheel to zoom. Everything goes through
 * the camera store; React never re-renders for a gesture frame. A drag that moved suppresses the click that follows.
 * Elements marked `data-no-pan` (hotspots, the lens handle, toolbars) are left alone.
 */
import { useEffect, useRef, type RefObject } from "react";
import { camLimits, panBy, zoomAt, type Box } from "./camera";
import type { CameraStore } from "./camera-store";

const DRAG_THRESHOLD_PX = 6;
const WHEEL_SENSITIVITY = 0.0018;
const LINE_HEIGHT_PX = 16;

interface Options {
  store: CameraStore;
  bounds: Box;
  /** Pan and pinch (touch and mouse). */
  enabled: boolean;
  /** Plain wheel zooms (otherwise only Ctrl or Cmd plus wheel, which is also how a trackpad pinch arrives). */
  wheelAlways: boolean;
  onStart?: () => void;
}

export interface GestureState {
  /** True for a moment after a drag ended: ignore the click it produces. */
  justDragged: () => boolean;
}

export function useStageGestures(ref: RefObject<HTMLElement | null>, options: Options): GestureState {
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });
  const dragged = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDistance = 0;
    let moved = false;
    let origin = { x: 0, y: 0 };

    const local = (event: { clientX: number; clientY: number }) => {
      const rect = element.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const apply = (next: (cam: ReturnType<CameraStore["get"]>, size: ReturnType<CameraStore["getSize"]>) => ReturnType<CameraStore["get"]>) => {
      const { store } = latest.current;
      store.set(next(store.get(), store.getSize()));
    };

    const onDown = (event: PointerEvent) => {
      const { enabled, onStart } = latest.current;
      if (!enabled || (event.pointerType === "mouse" && event.button !== 0)) return;
      if ((event.target as Element | null)?.closest("[data-no-pan]")) return;
      pointers.set(event.pointerId, local(event));
      if (pointers.size === 1) {
        origin = local(event);
        moved = false;
      }
      if (pointers.size === 2) {
        const [a, b] = Array.from(pointers.values());
        pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
        moved = true;
        onStart?.();
      }
    };

    const onMove = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      const now = local(event);
      const { bounds } = latest.current;

      if (pointers.size >= 2) {
        const before = Array.from(pointers.values());
        pointers.set(event.pointerId, now);
        const after = Array.from(pointers.values());
        const distance = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y);
        const midBefore = { x: (before[0].x + before[1].x) / 2, y: (before[0].y + before[1].y) / 2 };
        const midAfter = { x: (after[0].x + after[1].x) / 2, y: (after[0].y + after[1].y) / 2 };
        apply((cam, size) => {
          const limits = camLimits(bounds, size);
          const factor = pinchDistance > 0 ? distance / pinchDistance : 1;
          const zoomed = zoomAt(cam, size, midAfter.x, midAfter.y, factor, bounds, limits);
          return panBy(zoomed, midAfter.x - midBefore.x, midAfter.y - midBefore.y, bounds, limits);
        });
        pinchDistance = distance;
        return;
      }

      pointers.set(event.pointerId, now);
      if (!moved && Math.hypot(now.x - origin.x, now.y - origin.y) < DRAG_THRESHOLD_PX) return;
      if (!moved) {
        moved = true;
        latest.current.onStart?.();
        try {
          element.setPointerCapture(event.pointerId);
        } catch {
          // The pointer may already be gone; panning still works without capture.
        }
      }
      apply((cam, size) => panBy(cam, now.x - previous.x, now.y - previous.y, bounds, camLimits(bounds, size)));
    };

    const onUp = (event: PointerEvent) => {
      if (!pointers.delete(event.pointerId)) return;
      if (moved) dragged.current = performance.now();
      if (pointers.size < 2) pinchDistance = 0;
    };

    const onWheel = (event: WheelEvent) => {
      const { enabled, wheelAlways, store, bounds, onStart } = latest.current;
      if (!enabled) return;
      if (!wheelAlways && !event.ctrlKey && !event.metaKey) return;
      if ((event.target as Element | null)?.closest("[data-no-pan]")) return;
      event.preventDefault();
      onStart?.();
      const unit = event.deltaMode === 1 ? LINE_HEIGHT_PX : event.deltaMode === 2 ? 400 : 1;
      const factor = Math.exp(-event.deltaY * unit * WHEEL_SENSITIVITY);
      const point = local(event);
      store.set(zoomAt(store.get(), store.getSize(), point.x, point.y, factor, bounds, camLimits(bounds, store.getSize())));
    };

    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onUp);
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
      element.removeEventListener("wheel", onWheel);
    };
  }, [ref]);

  return { justDragged: () => performance.now() - dragged.current < 80 };
}
