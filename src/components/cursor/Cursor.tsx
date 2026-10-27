"use client";

/**
 * S8 cursor. Owner: motion-lead. Mounted by `MotionRoot` only on a fine pointer, off Tier C, once the tier is known.
 *
 * A small espresso circle with a champagne halo (reversed at night, cursor.css). It grows into a ring over links and
 * buttons, and becomes a labelled disc over anything with `data-cursor-label="View|Drag|Explore"`. Text fields keep the
 * native cursor. Never an arrow-and-glow cursor (Darshit rejected it).
 *
 * Data attributes for other leads (see cursor-state.ts):
 *   data-cursor-label="View"     labelled disc over this element (images, plan, galleries)
 *   data-cursor="grow"           ring on a non-interactive element
 *   data-cursor="native"         native cursor over this element and its children (maps, canvases, inputs)
 *   data-cursor="default"        plain small circle even on a link
 * Two layers, because blending only works against the page when the blending element is not inside another
 * stacking context: the dot blends, the disc does not (it keeps the brand colour and readable text).
 */
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { useDeviceTier } from "@/lib/device-tier-provider";
import { EASE } from "@/motion/constants";
import { registerMotion } from "@/motion/setup";
import "./cursor.css";
import { DEFAULT_STATE, resolveCursorState, sameState, type CursorState } from "./cursor-state";

const DOT_FOLLOW_SECONDS = 0.16;
const DISC_FOLLOW_SECONDS = 0.38;
const GROW_SCALE = 2.8;
const PRESS_FACTOR = 0.82;
const STATE_SECONDS = 0.4;

export function Cursor() {
  const { ready, finePointer, tier } = useDeviceTier();
  const allowed = ready && finePointer && tier !== "C";
  const dotRef = useRef<HTMLDivElement>(null);
  const dotShapeRef = useRef<HTMLSpanElement>(null);
  const dotFillRef = useRef<HTMLSpanElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const discShapeRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!allowed) return;
    const dot = dotRef.current;
    const dotShape = dotShapeRef.current;
    const dotFill = dotFillRef.current;
    const disc = discRef.current;
    const discShape = discShapeRef.current;
    const label = labelRef.current;
    if (!dot || !dotShape || !dotFill || !disc || !discShape || !label) return;
    if (window.matchMedia("(forced-colors: active)").matches) return;
    registerMotion();

    const html = document.documentElement;
    let shown = false;
    let pressed = false;
    let state: CursorState = DEFAULT_STATE;
    let lastX = 0;
    let lastY = 0;
    let frame = 0;

    const context = gsap.context(() => {
      gsap.set([dot, disc], { x: -100, y: -100, opacity: 0 });
      gsap.set(discShape, { scale: 0 });
    });

    const dotX = gsap.quickTo(dot, "x", { duration: DOT_FOLLOW_SECONDS, ease: EASE.out });
    const dotY = gsap.quickTo(dot, "y", { duration: DOT_FOLLOW_SECONDS, ease: EASE.out });
    const discX = gsap.quickTo(disc, "x", { duration: DISC_FOLLOW_SECONDS, ease: EASE.out });
    const discY = gsap.quickTo(disc, "y", { duration: DISC_FOLLOW_SECONDS, ease: EASE.out });

    const dotScaleFor = (value: CursorState): number => {
      const base = value.kind === "grow" ? GROW_SCALE : value.kind === "default" ? 1 : 0;
      return pressed ? base * PRESS_FACTOR : base;
    };

    const apply = (next: CursorState, animate = true) => {
      state = next;
      const duration = animate ? STATE_SECONDS : 0;
      const visible = shown && next.kind !== "native";

      gsap.to([dot, disc], { opacity: visible ? 1 : 0, duration: animate ? 0.2 : 0, ease: "none", overwrite: "auto" });
      gsap.to(dotShape, { scale: dotScaleFor(next), duration, ease: EASE.out, overwrite: "auto" });
      gsap.to(dotFill, { opacity: next.kind === "default" ? 1 : 0, duration: animate ? 0.25 : 0, ease: "none", overwrite: "auto" });

      if (next.kind === "label") {
        label.textContent = next.label;
        gsap.to(discShape, { scale: pressed ? PRESS_FACTOR : 1, duration, ease: EASE.out, overwrite: "auto" });
      } else {
        gsap.to(discShape, { scale: 0, duration: animate ? 0.25 : 0, ease: EASE.out, overwrite: "auto" });
      }
    };

    const show = (x: number, y: number) => {
      if (shown) return;
      shown = true;
      gsap.set([dot, disc], { x, y });
      html.dataset.piCursor = "on";
      apply(state, false);
    };

    const hide = () => {
      if (!shown) return;
      shown = false;
      gsap.to([dot, disc], { opacity: 0, duration: 0.2, ease: "none", overwrite: "auto" });
    };

    const retarget = (target: EventTarget | null) => {
      const next = resolveCursorState(target instanceof Element ? target : null);
      if (!sameState(next, state)) apply(next);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      lastX = event.clientX;
      lastY = event.clientY;
      if (!shown) show(lastX, lastY);
      dotX(lastX);
      dotY(lastY);
      discX(lastX);
      discY(lastY);
    };

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      retarget(event.target);
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.button !== 0) return;
      pressed = true;
      apply(state);
    };
    const onUp = () => {
      if (!pressed) return;
      pressed = false;
      apply(state);
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

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    html.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      window.removeEventListener("scroll", onScroll);
      html.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      if (frame) cancelAnimationFrame(frame);
      gsap.killTweensOf([dot, disc, dotShape, dotFill, discShape]);
      context.revert();
      delete html.dataset.piCursor;
    };
  }, [allowed]);

  if (!allowed) return null;

  return (
    <>
      <div ref={dotRef} className="pi-cursor pi-cursor--dot" aria-hidden="true">
        <span ref={dotShapeRef} className="pi-cursor__shape">
          <span className="pi-cursor__ring" />
          <span ref={dotFillRef} className="pi-cursor__fill" />
        </span>
      </div>
      <div ref={discRef} className="pi-cursor pi-cursor--disc" aria-hidden="true">
        <span ref={discShapeRef} className="pi-cursor__disc">
          <span ref={labelRef} className="pi-cursor__label" />
        </span>
      </div>
    </>
  );
}
