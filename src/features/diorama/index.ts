/**
 * Public API of the diorama feature (S4). Owner: scene-lead.
 *
 *   import { DioramaSlot } from "@/features/diorama";   // light: loads the diorama code on demand
 *
 * Only the slot is exported from here, so importing it from a page never pulls Three.js into the page's JavaScript.
 */
export { DioramaSlot } from "./DioramaSlot";
export type { DioramaSlotProps } from "./DioramaSlot";
