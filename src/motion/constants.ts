/**
 * Shared motion constants. Owner: motion-lead.
 *
 * Kept in their own module so primitives can import them without a cycle through `index.ts`.
 */

/** Named eases shared by every primitive. "draft" is a CustomEase registered by `registerMotion()`. */
export const EASE = {
  draft: "draft",
  out: "power3.out",
  expo: "expo.out",
  inOut: "power3.inOut",
} as const;

export const DURATION = {
  quick: 0.35,
  base: 0.7,
  slow: 1.2,
  draw: 1.6,
} as const;

/**
 * The "draft" curve as SVG path data: slow, weighted, precise, never bouncy. It is the same curve as
 * `--ease-draft` in tokens.css (cubic-bezier(0.65, 0, 0.15, 1)), so CSS and GSAP motion feel alike.
 */
export const DRAFT_EASE_PATH = "M0,0 C0.65,0 0.15,1 1,1";

/** Default ScrollTrigger start for one-shot reveals: the element's top edge has risen to 85% of the viewport. */
export const REVEAL_START = "top 85%";
