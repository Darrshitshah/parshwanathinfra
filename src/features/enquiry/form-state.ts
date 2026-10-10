/**
 * Plain state helpers for the enquiry form (no React): the shape of the values, the defaults (including
 * pre-fill and a saved draft) and the conversion to the payload the API expects. Owner: pages-lead.
 */
import { DEFAULT_BUDGET, DEFAULT_INTEREST, isBudget, isInterest, type Budget, type Interest } from "./options";
import type { EnquiryField, EnquiryInput } from "./schema";
import type { EnquiryConfig, EnquiryPrefill } from "./types";

export interface FormValues {
  name: string;
  phone: string;
  email: string;
  project: string;
  interest: Interest;
  budget: Budget;
  visitDate: string;
  message: string;
  consent: boolean;
  /** Honeypot. Never shown to people. */
  website: string;
}

/** Order the fields appear in, used to focus the first one with an error. */
export const FIELD_ORDER: readonly EnquiryField[] = [
  "name",
  "phone",
  "email",
  "project",
  "interest",
  "budget",
  "visitDate",
  "message",
  "consent",
];

/** DOM id of a field's control, shared by the labels, the error links and the focus helper. */
export function fieldId(scope: string, field: EnquiryField): string {
  return `${scope}-${field}`;
}

export function buildInitialValues(
  config: EnquiryConfig,
  prefill: EnquiryPrefill = {},
  draft: Partial<FormValues> = {},
): FormValues {
  return {
    name: draft.name ?? "",
    phone: draft.phone ?? "",
    email: draft.email ?? "",
    project: prefill.project ?? draft.project ?? config.defaultProject,
    interest: isInterest(prefill.interest) ? prefill.interest : (draft.interest ?? DEFAULT_INTEREST),
    budget: isBudget(draft.budget) ? draft.budget : DEFAULT_BUDGET,
    visitDate: draft.visitDate ?? "",
    message: draft.message ?? "",
    consent: draft.consent ?? false,
    website: "",
  };
}

export interface PayloadMeta {
  openedAt: number;
  plot?: number;
  unit?: string;
  source?: string;
}

export function toInput(values: FormValues, meta: PayloadMeta): EnquiryInput {
  return {
    name: values.name,
    phone: values.phone,
    email: values.email,
    project: values.project,
    interest: values.interest,
    budget: values.budget,
    visitDate: values.visitDate,
    message: values.message,
    consent: values.consent,
    website: values.website,
    openedAt: meta.openedAt,
    ...(meta.plot === undefined ? {} : { plot: meta.plot }),
    ...(meta.unit ? { unit: meta.unit } : {}),
    ...(meta.source ? { source: meta.source } : {}),
  };
}
