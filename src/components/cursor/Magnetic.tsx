"use client";

/**
 * Magnetic pull for primary CTAs, and the slight image parallax on hover (S8). Owner: motion-lead.
 *
 * Fine pointer only, off Tier C and reduced motion; elsewhere they do nothing and the element sits still.
 * Transform only. The element is pulled toward the pointer while the pointer is within `radius` px of it, and eases
 * back when it leaves. Never bouncy. Thin layer: GSAP arrives through `useMotionEffect`, not an import.
 *
 *   <Magnetic><a className="...">Plan a visit</a></Magnetic>
 *   const ref = useRef<HTMLButtonElement>(null); useMagnetic(ref);       // no wrapper element
 *   useHoverParallax(frameRef)                                          // image drifts inside its frame on hover
 */
import { useRef, type ElementType, type ReactNode, type RefObject } from "react";
import { useDeviceTier } from "@/lib/device-tier-provider";
import { EASE } from "@/motion/constants";
import { useMotionEffect } from "@/motion/hooks";
import { clamp } from "@/motion/math";

export interface MagneticOptions {
  /** Fraction of the pointer offset the element follows (default 0.3). */
  strength?: number;
  /** Pull starts this many px outside the element (default 70). */
  radius?: number;
  /** Never move further than this many px (default 14). */
  max?: number;
}

function usePointerFlourishEnabled(): boolean {
  const { ready, tier, finePointer, reducedMotion } = useDeviceTier();
  return ready && finePointer && tier !== "C" && !reducedMotion;
}

export function useMagnetic<T extends HTMLElement>(ref: RefObject<T | null>, options: MagneticOptions = {}): void {
  const enabled = usePointerFlourishEnabled();
  const { strength = 0.3, radius = 70, max = 14 } = options;

  useMotionEffect(ref, enabled, `${strength}|${radius}|${max}`, ({ gsap }, element) => {
    const moveX = gsap.quickTo(element, "x", { duration: 0.6, ease: EASE.out });
    const moveY = gsap.quickTo(element, "y", { duration: 0.6, ease: EASE.out });
    let engaged = false;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = element.getBoundingClientRect();
      // The rect includes the current pull, so take it out to find where the element really sits.
      const centreX = rect.left - Number(gsap.getProperty(element, "x")) + rect.width / 2;
      const centreY = rect.top - Number(gsap.getProperty(element, "y")) + rect.height / 2;
      const dx = event.clientX - centreX;
      const dy = event.clientY - centreY;
      const reach = Math.max(rect.width, rect.height) / 2 + radius;
      if (Math.hypot(dx, dy) <= reach) {
        engaged = true;
        moveX(clamp(dx * strength, -max, max));
        moveY(clamp(dy * strength, -max, max));
      } else if (engaged) {
        engaged = false;
        moveX(0);
        moveY(0);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.killTweensOf(element);
      gsap.set(element, { clearProps: "x,y" });
    };
  });
}

export interface MagneticProps extends MagneticOptions {
  children: ReactNode;
  className?: string;
  /** Wrapper element, default "span" (inline-block, so it can move). */
  as?: ElementType;
}

/** Wraps one primary CTA. The wrapper is `display: inline-block`; give the child the visual styling. */
export function Magnetic({ children, className, as: Tag = "span", strength, radius, max }: MagneticProps) {
  const ref = useRef<HTMLElement>(null);
  useMagnetic(ref, { strength, radius, max });
  return (
    <Tag ref={ref} className={["inline-block", className].filter(Boolean).join(" ")}>
      {children}
    </Tag>
  );
}

export interface HoverParallaxOptions {
  /** Pixels the image travels at the frame's edge (default 12). */
  strength?: number;
  /** The image is scaled up this much so its edges never show (default 1.08). */
  scale?: number;
}

/**
 * A slight parallax of the image inside its frame while the pointer moves over it.
 * `ref` is the frame (give it `overflow: hidden`); the moving image is `[data-hover-parallax]` inside it, or the
 * frame's first element child.
 */
export function useHoverParallax<T extends HTMLElement>(ref: RefObject<T | null>, options: HoverParallaxOptions = {}): void {
  const enabled = usePointerFlourishEnabled();
  const { strength = 12, scale = 1.08 } = options;

  useMotionEffect(ref, enabled, `${strength}|${scale}`, ({ gsap }, frame) => {
    const image = frame.querySelector<HTMLElement>("[data-hover-parallax]") ?? frame.firstElementChild;
    if (!(image instanceof HTMLElement)) return;

    gsap.set(image, { scale });
    const moveX = gsap.quickTo(image, "x", { duration: 0.7, ease: EASE.out });
    const moveY = gsap.quickTo(image, "y", { duration: 0.7, ease: EASE.out });

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = frame.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      moveX(clamp(-nx * strength, -strength, strength));
      moveY(clamp(-ny * strength, -strength, strength));
    };
    const onLeave = () => {
      moveX(0);
      moveY(0);
    };

    frame.addEventListener("pointermove", onMove, { passive: true });
    frame.addEventListener("pointerleave", onLeave);
    return () => {
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(image);
      gsap.set(image, { clearProps: "x,y,scale" });
    };
  });
}
