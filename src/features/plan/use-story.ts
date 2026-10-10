"use client";

/**
 * The scroll story: one pinned panel and one GSAP timeline that carries the camera through the six chapters.
 * GSAP and ScrollTrigger come through the thin motion layer (loaded on demand), never imported here.
 * The pin lasts scrollPerChapter(tier) viewport heights per chapter, shorter on Tier B. Everything is created in a
 * gsap.context and reverted on unmount, on route change and when the story is switched off.
 */
import { useEffect, useRef, type RefObject } from "react";
import { plan } from "@/content/plan";
import type { Chapter } from "@/content/schema";
import { useMotionEffect } from "@/motion/hooks";
import { fitBox, type Box } from "./camera";
import type { CameraStore } from "./camera-store";
import { cameraAtTime, scrollPerChapter, storyDuration, storyPhase, type StoryPhase } from "./story";

const MARGIN_PX = 14;

interface StoryOptions {
  pinRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  tier: "A" | "B";
  store: CameraStore;
  chapters: readonly Chapter[];
  onPhase: (phase: StoryPhase) => void;
}

export function useStory({ pinRef, enabled, tier, store, chapters, onPhase }: StoryOptions): void {
  const phaseRef = useRef(onPhase);
  useEffect(() => {
    phaseRef.current = onPhase;
  });

  useMotionEffect(pinRef, enabled, `${tier}|${chapters.length}`, ({ gsap, ScrollTrigger }, pin) => {
    const count = chapters.length;
    const total = storyDuration(count);
    const boxes: Box[] = [plan.grid.viewBox, ...chapters.map((chapter) => chapter.view)];
    const fit = (index: number) => fitBox(boxes[index], store.getSize(), index === 0 ? 0 : MARGIN_PX);
    const headerPx = () => pin.parentElement?.querySelector(".lp-header-probe")?.getBoundingClientRect().height ?? 0;

    const context = gsap.context(() => {
      store.set(fit(0));
      phaseRef.current(storyPhase(0, count));

      // One scrubbed tween drives a progress value; the camera and the chapter text are pure functions of it.
      const progress = { p: 0 };
      gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          pin: true,
          scrub: tier === "A" ? 0.6 : true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          start: () => `top ${Math.round(headerPx())}px`,
          end: () => `+=${Math.round(window.innerHeight * scrollPerChapter(tier) * count)}`,
        },
      }).to(progress, {
        p: 1,
        duration: 1,
        ease: "none",
        onUpdate: () => {
          const time = progress.p * total;
          // Re-fit on every update so a resize or a rotation lands on the right view without a refresh.
          store.set(cameraAtTime(time, boxes.map((_, index) => fit(index))));
          phaseRef.current(storyPhase(time, count));
        },
      });
    }, pin);

    return () => {
      context.revert();
      ScrollTrigger.refresh();
    };
  });
}
