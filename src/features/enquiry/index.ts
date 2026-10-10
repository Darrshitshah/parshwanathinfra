/**
 * Public API of the enquiry feature. Owner: pages-lead.
 *
 *   import { useEnquiry } from "@/features/enquiry";
 *   const { open } = useEnquiry();
 *   open({ plot: 42, interest: "2bhk-rowhouse" });   // plan-lead: plot picker
 *   open({ unit: "Block B3, floor 2" });             // plan-lead: building explorer
 *
 * This barrel stays light on purpose (no zod, no form): importing it from a client component never pulls the
 * form into the page's first load. The form is "@/features/enquiry/EnquiryForm" (used by the Contact page), the
 * validation is "@/features/enquiry/schema" (also used by the route handler), and the server-only config builder
 * is "@/features/enquiry/config".
 */
export { EnquiryProvider, useEnquiry } from "./EnquiryProvider";
export { INTEREST_VALUES, BUDGET_VALUES, interestForPlotType } from "./options";
export type { Interest, Budget } from "./options";
export type { EnquiryConfig, EnquiryContextValue, EnquiryPrefill } from "./types";
