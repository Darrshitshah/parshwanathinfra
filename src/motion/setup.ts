/**
 * GSAP plugin registration. Owner: motion-lead.
 *
 * Registered globally (every page needs them): ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase.
 * Loaded on demand (see `lazy.ts`): MorphSVGPlugin, Flip, Observer.
 *
 * Importing this module is safe on the server; `registerMotion()` does nothing until it runs in a browser.
 */
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DRAFT_EASE_PATH, EASE } from "./constants";

let registered = false;

/** Register GSAP plugins and the "draft" CustomEase once, on the client. Idempotent. */
export function registerMotion(): void {
  if (registered || typeof window === "undefined") return;
  registered = true;

  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase);
  CustomEase.create(EASE.draft, DRAFT_EASE_PATH);

  // Targets that unmount before an animation starts are normal in React; do not warn about them.
  gsap.config({ nullTargetWarn: false });
  // Mobile URL-bar show/hide fires resize events; refreshing every ScrollTrigger on each one causes jank.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export function isMotionRegistered(): boolean {
  return registered;
}
