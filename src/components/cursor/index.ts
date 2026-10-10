/**
 * S8 cursor and micro-interactions (BUILD_SPEC section 7). Owner: motion-lead.
 *
 * `Cursor` is mounted by `MotionRoot` (loaded on demand, so it is deliberately not exported here: importing it would
 * pull GSAP into the initial bundle). Other leads only use the data attributes and these helpers:
 *   data-cursor-label="View | Drag | Explore"   labelled disc over an element
 *   data-cursor="grow | native | default"       ring, native cursor, or plain small circle
 *   <Magnetic>, useMagnetic(ref)                magnetic pull for primary CTAs
 *   useHoverParallax(frameRef)                  image drifts inside its frame on hover
 */
export { Magnetic, useHoverParallax, useMagnetic, type HoverParallaxOptions, type MagneticOptions, type MagneticProps } from "./Magnetic";
export { resolveCursorState, type CursorState } from "./cursor-state";
