/**
 * The enquiry contract: one zod schema shared by the client form and the route handler (BUILD_SPEC section 9).
 * Fields: name, phone (Indian mobile), email (optional), project, interest, budget, preferred visit date (optional),
 * message (optional), consent; plus the honeypot (`website`), the form-open timestamp (`openedAt`, for the 3 s time
 * trap) and a little context (plot, unit, source page). Owner: pages-lead.
 *
 * Error messages in the schema are stable codes (see ERROR_CODES); the UI maps them to strings in
 * src/content/i18n/en.ts, so the server never needs to know the language.
 */
import { z } from "zod";
import { BUDGET_VALUES, INTEREST_VALUES } from "./options";
import { normalizePhone } from "./phone";

export { normalizePhone, formatPhone, INDIAN_MOBILE_PATTERN } from "./phone";

/* ------------------------------------------------------------------------------------------------ */
/* Limits                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

export const NAME_MIN = 2;
export const NAME_MAX = 80;
export const EMAIL_MAX = 254;
export const MESSAGE_MAX = 1000;
export const PLOT_MAX = 165;
/** Submissions earlier than this after the form opened are treated as bots (BUILD_SPEC section 9). */
export const MIN_FILL_MS = 3000;
/** How far ahead a visit date may be. */
export const MAX_VISIT_DAYS_AHEAD = 366;
/** Client clocks may run ahead of the server by this much before openedAt is called implausible. */
const CLOCK_SKEW_MS = 60_000;

/* ------------------------------------------------------------------------------------------------ */
/* Error codes                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

export const ERROR_CODES = [
  "nameRequired",
  "nameShort",
  "nameLong",
  "phoneRequired",
  "phoneInvalid",
  "emailInvalid",
  "projectInvalid",
  "interestInvalid",
  "budgetInvalid",
  "visitDateInvalid",
  "visitDatePast",
  "visitDateFar",
  "messageLong",
  "consentRequired",
  "generic",
] as const;

export type EnquiryErrorCode = (typeof ERROR_CODES)[number];

export function isErrorCode(value: unknown): value is EnquiryErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------------------------------------ */
/* Dates: "today" is always the date in India, on the client and on the server, so they cannot disagree. */
/* ------------------------------------------------------------------------------------------------ */

const INDIA_TIME_ZONE = "Asia/Kolkata";

/** Today's date in India as YYYY-MM-DD. */
export function todayInIndia(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

export function parseIsoDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const real = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? { year, month, day } : null;
}

export function addDaysIso(value: string, days: number): string {
  const parts = parseIsoDate(value);
  if (!parts) return value;
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days)).toISOString().slice(0, 10);
}

/** null when the date is empty (it is optional) or acceptable, otherwise the error code. */
export function checkVisitDate(value: string, now: Date = new Date()): EnquiryErrorCode | null {
  if (value === "") return null;
  if (!parseIsoDate(value)) return "visitDateInvalid";
  const today = todayInIndia(now);
  if (value < today) return "visitDatePast";
  if (value > addDaysIso(today, MAX_VISIT_DAYS_AHEAD)) return "visitDateFar";
  return null;
}

/* ------------------------------------------------------------------------------------------------ */
/* Schema                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

const emailChecker = z.email();
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const enquirySchema = z.object({
  name: z.string().trim().min(1, "nameRequired").min(NAME_MIN, "nameShort").max(NAME_MAX, "nameLong"),
  phone: z
    .string()
    .trim()
    .min(1, "phoneRequired")
    .refine((value) => value === "" || normalizePhone(value) !== null, "phoneInvalid"),
  email: z
    .string()
    .trim()
    .max(EMAIL_MAX, "emailInvalid")
    .refine((value) => value === "" || emailChecker.safeParse(value).success, "emailInvalid")
    .default(""),
  project: z.string().trim().min(1, "projectInvalid").max(60, "projectInvalid").regex(SLUG_PATTERN, "projectInvalid"),
  interest: z.enum(INTEREST_VALUES, { message: "interestInvalid" }),
  budget: z.enum(BUDGET_VALUES, { message: "budgetInvalid" }),
  visitDate: z
    .string()
    .trim()
    .default("")
    .superRefine((value, ctx) => {
      const code = checkVisitDate(value);
      if (code) ctx.addIssue({ code: "custom", message: code });
    }),
  message: z.string().trim().max(MESSAGE_MAX, "messageLong").default(""),
  consent: z.boolean().refine((value) => value === true, "consentRequired"),
  plot: z.number().int().min(1, "generic").max(PLOT_MAX, "generic").optional(),
  unit: z.string().trim().max(60, "generic").optional(),
  /** The page the enquiry was sent from, for the team's context. */
  source: z.string().trim().max(160, "generic").optional(),
  /** Honeypot: a real visitor never sees this field, so it must be empty. */
  website: z.string().max(500, "generic").default(""),
  /** Epoch milliseconds when the form opened (the 3 s time trap). */
  openedAt: z.number().int().positive("generic"),
});

export type EnquiryInput = z.input<typeof enquirySchema>;
export type EnquiryData = z.output<typeof enquirySchema>;
export type EnquiryField = keyof EnquiryInput;
export type EnquiryFieldErrors = Partial<Record<EnquiryField, EnquiryErrorCode>>;

export type EnquiryValidation =
  | { ok: true; data: EnquiryData }
  | { ok: false; errors: EnquiryFieldErrors };

const KNOWN_FIELDS = new Set<string>(Object.keys(enquirySchema.shape));

export function validateEnquiry(input: unknown): EnquiryValidation {
  const result = enquirySchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const errors: EnquiryFieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !KNOWN_FIELDS.has(field)) continue;
    if (errors[field as EnquiryField]) continue;
    errors[field as EnquiryField] = isErrorCode(issue.message) ? issue.message : "generic";
  }
  // A body that fails with no recognised field (for example not an object) still reports as invalid.
  if (Object.keys(errors).length === 0) errors.name = "generic";
  return { ok: false, errors };
}

/** The lead as the team receives it: phone reduced to the bare ten digits. */
export interface Lead {
  name: string;
  phone: string;
  email: string;
  project: string;
  interest: EnquiryData["interest"];
  budget: EnquiryData["budget"];
  visitDate: string;
  message: string;
  plot?: number;
  unit?: string;
  source?: string;
}

export function toLead(data: EnquiryData): Lead {
  return {
    name: data.name,
    phone: normalizePhone(data.phone) ?? data.phone,
    email: data.email,
    project: data.project,
    interest: data.interest,
    budget: data.budget,
    visitDate: data.visitDate,
    message: data.message,
    plot: data.plot,
    unit: data.unit,
    source: data.source,
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Time trap                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

export type TimeTrapResult = "ok" | "too-fast" | "implausible";

export function checkTimeTrap(openedAt: number, now: number = Date.now()): TimeTrapResult {
  if (openedAt > now + CLOCK_SKEW_MS) return "implausible";
  if (now - openedAt < MIN_FILL_MS) return "too-fast";
  return "ok";
}
