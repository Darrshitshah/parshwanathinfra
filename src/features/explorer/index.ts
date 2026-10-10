/**
 * Public API of the building explorer (S5). Owner: plan-lead.
 *
 *   import { ExplorerSlot } from "@/features/explorer";                         // light: loads on demand
 *   import { BuildingExplorer } from "@/features/explorer/BuildingExplorer";   // inline panel (import dynamically)
 *
 * This barrel exports only the slot, so importing it from a page never pulls the explorer into the page's JS.
 */
export { ExplorerSlot } from "./ExplorerSlot";
