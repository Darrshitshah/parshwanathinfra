/**
 * Choice lists for the enquiry form. Values are stable codes (sent to the server); labels come from
 * src/content/i18n/en.ts (`en.enquiry.interest` and `en.enquiry.budget`). Owner: pages-lead.
 *
 * The budget bands are placeholders chosen to cover a wide range; they are not prices and do not describe the
 * project. Darshit confirms the bands (see the report's questions).
 */

export const INTEREST_VALUES = [
  "1bhk-flat",
  "2bhk-flat",
  "2bhk-rowhouse",
  "3bhk-rowhouse",
  "shop",
  "not-sure",
] as const;

export const BUDGET_VALUES = ["under-20", "20-30", "30-45", "45-60", "above-60", "not-sure"] as const;

export type Interest = (typeof INTEREST_VALUES)[number];
export type Budget = (typeof BUDGET_VALUES)[number];

export const DEFAULT_INTEREST: Interest = "not-sure";
export const DEFAULT_BUDGET: Budget = "not-sure";

export function isInterest(value: unknown): value is Interest {
  return typeof value === "string" && (INTEREST_VALUES as readonly string[]).includes(value);
}

export function isBudget(value: unknown): value is Budget {
  return typeof value === "string" && (BUDGET_VALUES as readonly string[]).includes(value);
}

/**
 * Convenience for the plot picker: a row-house plot's type ("2BHK", "3BHK" or "TBD") as an interest value.
 * Anything unconfirmed maps to "not-sure" so a buyer is never pre-filled with a guess.
 */
export function interestForPlotType(type: string): Interest {
  if (type === "2BHK") return "2bhk-rowhouse";
  if (type === "3BHK") return "3bhk-rowhouse";
  return "not-sure";
}
