"use client";

/**
 * When the hero film may start: the page has loaded, the browser is idle and the hero is on screen. Also tells the
 * player whether the hero is visible right now (and the tab is in front) so it can pause when it is not.
 * State is only set from callbacks (load, idle, observer, visibilitychange), never synchronously in an effect.
 */
import { useEffect, useState, type RefObject } from "react";
import { NARROW_VIEWPORT_QUERY } from "@/lib/hero-film";

/** Longest wait for an idle moment before starting anyway, and the delay used where requestIdleCallback is missing. */
const IDLE_TIMEOUT_MS = 2000;
const IDLE_FALLBACK_MS = 300;
/** The share of the hero that must be in view to count as visible. */
const VISIBLE_RATIO = 0.15;

export interface HeroFilmGate {
  /** Load and idle have passed and the hero has been seen: the video element may be created. */
  armed: boolean;
  /** The hero is on screen and the tab is in front: the video may play. */
  visible: boolean;
  /** Viewport class, read once when the gate opens (null before). The cut is not switched mid-playback. */
  narrow: boolean | null;
}

function afterLoadAndIdle(run: () => void): () => void {
  let cancelled = false;
  let idleHandle: number | undefined;
  let timer: number | undefined;
  const fire = () => {
    if (!cancelled) run();
  };
  const onLoad = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(fire, { timeout: IDLE_TIMEOUT_MS });
    } else {
      timer = window.setTimeout(fire, IDLE_FALLBACK_MS);
    }
  };
  if (document.readyState === "complete") onLoad();
  else window.addEventListener("load", onLoad, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", onLoad);
    if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleHandle);
    if (timer !== undefined) window.clearTimeout(timer);
  };
}

export function useHeroFilmGate(rootRef: RefObject<HTMLElement | null>, enabled: boolean): HeroFilmGate {
  const [narrow, setNarrow] = useState<boolean | null>(null);
  const [inView, setInView] = useState(false);
  const [everSeen, setEverSeen] = useState(false);
  const [tabFront, setTabFront] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    return afterLoadAndIdle(() => setNarrow(window.matchMedia(NARROW_VIEWPORT_QUERY).matches));
  }, [enabled]);

  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const latest = entries[entries.length - 1];
        if (!latest) return;
        setInView(latest.isIntersecting);
        if (latest.isIntersecting) setEverSeen(true);
      },
      { threshold: VISIBLE_RATIO },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [enabled, rootRef]);

  useEffect(() => {
    if (!enabled) return;
    const onChange = () => setTabFront(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [enabled]);

  return {
    armed: enabled && narrow !== null && everSeen,
    visible: enabled && inView && tabFront,
    narrow,
  };
}
