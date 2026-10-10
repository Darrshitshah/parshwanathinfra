/**
 * S1 loader (BUILD_SPEC section 7). Owner: motion-lead.
 *
 *   import { BoundaryLoader } from "@/components/loader";
 *   import { shapeFromPlan } from "@/motion/township";
 *   <BoundaryLoader {...shapeFromPlan(plan)} />
 */
export { BoundaryLoader, LOADER_SEEN_KEY, type BoundaryLoaderProps } from "./BoundaryLoader";
export { LOADER_TIMING, worstCaseSeconds } from "./progress";
