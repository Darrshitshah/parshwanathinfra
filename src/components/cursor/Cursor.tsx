"use client";

/**
 * S8 cursor. Owner: motion-lead. Mounted by `MotionRoot` only on a fine pointer, off Tier C, once the tier is known.
 *
 * A fine hairline ring with a small solid core (espresso with a champagne edge by day, reversed at night, cursor.css).
 * The ring trails the pointer a little, the core does not. Over links and buttons the ring springs out to a larger thin
 * ring and the core fades; over anything with `data-cursor-label="View|Drag|Explore"` a labelled disc takes over. Text
 * fields keep the native cursor. Never an arrow-and-glow cursor (Darshit rejected it).
 *
 * Data attributes for other leads (see cursor-state.ts):
 *   data-cursor-label="View"     labelled disc over this element (images, plan, galleries)
 *   data-cursor="grow"           larger ring on a non-interactive element
 *   data-cursor="native"         native cursor over this element and its children (maps, canvases, inputs)
 *   data-cursor="default"        plain ring and core even on a link
 * Nothing is scaled: each part is drawn at its real size (cursor-geometry.ts, cursor-motion.ts), so edges stay sharp at
 * every size and pixel ratio. Reduced motion: no spring, no lag, the cursor sits on the pointer.
 */
import { useEffect, useRef } from "react";
import { useDeviceTier } from "@/lib/device-tier-provider";
import { registerMotion } from "@/motion/setup";
import "./cursor.css";
import { geometryFor, motionProfile, type CursorGeometry } from "./cursor-geometry";
import {
  createFollowers,
  initParts,
  killParts,
  morph,
  readParts,
  setVisible,
  type MorphKind,
} from "./cursor-motion";
import { DEFAULT_STATE, resolveCursorState, sameState, type CursorState } from "./cursor-state";

export function Cursor() {
  const { ready, finePointer, tier } = useDeviceTier();
  const allowed = ready && finePointer && tier !== "C";
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!allowed) return;
    const parts = readParts(rootRef.current);
    if (!parts) return;
    if (window.matchMedia("(forced-colors: active)").matches) return;
    registerMotion();

    const html = document.documentElement;
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let motion = motionProfile(reducedQuery.matches);
    let followers = createFollowers(parts, motion);
    let shown = false;
    let pressed = false;
    let state: CursorState = DEFAULT_STATE;
    let geometry: CursorGeometry = geometryFor(state, pressed);
    let lastX = 0;
    let lastY = 0;
    let frame = 0;

    initParts(parts, geometry);

    const apply = (next: CursorState, kind: MorphKind) => {
      state = next;
      if (next.kind === "label") parts.label.textContent = next.label;
      const target = geometryFor(next, pressed);
      morph(parts, geometry, target, motion, shown ? kind : "instant");
      geometry = target;
      setVisible(parts, shown && next.kind !== "native", kind !== "instant");
    };

    const show = (x: number, y: number) => {
      if (shown) return;
      shown = true;
      followers.jumpTo(x, y);
      html.dataset.piCursor = "on";
      apply(state, "instant");
    };

    const hide = () => {
      if (!shown) return;
      shown = false;
      setVisible(parts, false, true);
    };

    const retarget = (target: EventTarget | null) => {
      const next = resolveCursorState(target instanceof Element ? target : null);
      if (sameState(next, state)) return;
      // Before the first move nothing is on screen; remember the state and draw it when the cursor appears.
      if (shown) apply(next, "state");
      else state = next;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      lastX = event.clientX;
      lastY = event.clientY;
      if (!shown) show(lastX, lastY);
      followers.moveTo(lastX, lastY);
    };

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      retarget(event.target);
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.button !== 0) return;
      pressed = true;
      apply(state, "press");
    };
    const onUp = () => {
      if (!pressed) return;
      pressed = false;
      apply(state, "press");
    };

    // Content moves under a still pointer while scrolling; re-check what is there once per frame.
    const onScroll = () => {
      if (!shown || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        retarget(document.elementFromPoint(lastX, lastY));
      });
    };

    const onLeave = () => hide();
    const onVisibility = () => {
      if (document.hidden) hide();
    };

    // Switching reduced motion on or off mid-session: rebuild the followers and settle the shape at once.
    const onMotionChange = () => {
      motion = motionProfile(reducedQuery.matches);
      followers.stop();
      followers = createFollowers(parts, motion);
      followers.jumpTo(lastX, lastY);
      killParts(parts);
      apply(state, "instant");
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    html.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    reducedQuery.addEventListener("change", onMotionChange);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      window.removeEventListener("scroll", onScroll);
      html.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery.removeEventListener("change", onMotionChange);
      if (frame) cancelAnimationFrame(frame);
      followers.stop();
      killParts(parts);
      delete html.dataset.piCursor;
    };
  }, [allowed]);

  if (!allowed) return null;

  return (
    <div ref={rootRef} className="pi-cursor-root" aria-hidden="true">
      <div className="pi-cursor pi-cursor--ring">
        <span className="pi-cursor__ring" />
      </div>
      <div className="pi-cursor pi-cursor--core">
        <span className="pi-cursor__core" />
      </div>
      <div className="pi-cursor pi-cursor--disc">
        <span className="pi-cursor__disc">
          <span className="pi-cursor__label" />
        </span>
      </div>
    </div>
  );
}
