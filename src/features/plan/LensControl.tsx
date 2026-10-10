"use client";

/**
 * The reality lens control: follows a mouse over the stage, or is dragged on touch. It is a real button
 * (arrow keys move it) so the lens is not pointer only. The photo itself is drawn in the SVG by <LensTiles>.
 */
import { useEffect, useRef, type RefObject } from "react";
import type { CameraStore } from "./camera-store";
import type { LensHandle } from "./TileLayers";
import { planStrings } from "./strings";

const KEY_STEP_PX = 28;

interface LensControlProps {
  store: CameraStore;
  stageRef: RefObject<HTMLElement | null>;
  lensRef: { current: LensHandle | null };
  radiusPx: number;
  /** Mouse or trackpad: the lens follows the pointer. Otherwise it is dragged by its handle. */
  follow: boolean;
}

export function LensControl({ store, stageRef, lensRef, radiusPx, follow }: LensControlProps) {
  const handleRef = useRef<HTMLButtonElement>(null);
  const position = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handle = handleRef.current;
    const stage = stageRef.current;
    if (!handle || !stage) return;

    const place = (x: number, y: number) => {
      const size = store.getSize();
      const px = Math.min(Math.max(x, 0), size.w);
      const py = Math.min(Math.max(y, 0), size.h);
      position.current = { x: px, y: py };
      handle.style.transform = `translate3d(${px - radiusPx}px, ${py - radiusPx}px, 0)`;
      lensRef.current?.moveTo(px, py);
    };
    const local = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const start = position.current ?? { x: store.getSize().w / 2, y: store.getSize().h / 2 };
    place(start.x, start.y);
    lensRef.current?.show(!follow);

    let dragging = false;
    const onHandleDown = (event: PointerEvent) => {
      dragging = true;
      handle.setPointerCapture(event.pointerId);
      const p = local(event);
      place(p.x, p.y);
      event.preventDefault();
    };
    const onHandleMove = (event: PointerEvent) => {
      if (!dragging) return;
      const p = local(event);
      place(p.x, p.y);
    };
    const onHandleUp = () => {
      dragging = false;
    };
    const onKey = (event: KeyboardEvent) => {
      const step = event.shiftKey ? KEY_STEP_PX * 3 : KEY_STEP_PX;
      const current = position.current ?? start;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      event.stopPropagation();
      place(current.x + move[0], current.y + move[1]);
    };
    const onStageMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const p = local(event);
      place(p.x, p.y);
      lensRef.current?.show(true);
    };
    const onStageLeave = () => lensRef.current?.show(false);

    handle.addEventListener("pointerdown", onHandleDown);
    handle.addEventListener("pointermove", onHandleMove);
    handle.addEventListener("pointerup", onHandleUp);
    handle.addEventListener("pointercancel", onHandleUp);
    handle.addEventListener("keydown", onKey);
    if (follow) {
      stage.addEventListener("pointermove", onStageMove);
      stage.addEventListener("pointerleave", onStageLeave);
    }
    return () => {
      handle.removeEventListener("pointerdown", onHandleDown);
      handle.removeEventListener("pointermove", onHandleMove);
      handle.removeEventListener("pointerup", onHandleUp);
      handle.removeEventListener("pointercancel", onHandleUp);
      handle.removeEventListener("keydown", onKey);
      stage.removeEventListener("pointermove", onStageMove);
      stage.removeEventListener("pointerleave", onStageLeave);
    };
  }, [store, stageRef, lensRef, radiusPx, follow]);

  return (
    <button
      ref={handleRef}
      type="button"
      className={follow ? "lp-lens-handle is-follow" : "lp-lens-handle"}
      data-no-pan=""
      style={{ width: radiusPx * 2, height: radiusPx * 2 }}
      aria-label={`${planStrings.tools.lens}. Arrow keys move it${follow ? "" : ", or drag it"}.`}
    />
  );
}
