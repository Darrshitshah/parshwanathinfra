/**
 * Public API of the Living Plan feature (S3). Owner: plan-lead.
 *
 *   import { LivingPlanSlot } from "@/features/plan";     // light: loads the plan code on demand
 *   import { LivingPlan } from "@/features/plan/LivingPlan"; // the plan itself (import dynamically)
 *
 * This barrel exports only the slot, so importing it from a page never pulls the plan code into the page's JS.
 */
export { LivingPlanSlot } from "./LivingPlanSlot";
