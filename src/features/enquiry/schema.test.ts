import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "@/content/i18n/en";
import {
  addDaysIso,
  checkTimeTrap,
  checkVisitDate,
  ERROR_CODES,
  MAX_VISIT_DAYS_AHEAD,
  MIN_FILL_MS,
  parseIsoDate,
  toLead,
  todayInIndia,
  validateEnquiry,
} from "./schema";

// 10 Oct 2026, 13:30 in India (08:00 UTC).
const NOW = new Date("2026-10-10T08:00:00Z");

const valid = {
  name: "Asha Patel",
  phone: "98765 43210",
  email: "",
  project: "shiv-shiva",
  interest: "2bhk-flat",
  budget: "not-sure",
  visitDate: "",
  message: "",
  consent: true,
  website: "",
  openedAt: NOW.getTime() - 20_000,
};

function errorsFor(overrides: Record<string, unknown>) {
  const result = validateEnquiry({ ...valid, ...overrides });
  return result.ok ? {} : result.errors;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("validateEnquiry", () => {
  it("accepts a complete enquiry and fills the optional fields", () => {
    const result = validateEnquiry({ name: "Asha Patel", phone: "9876543210", project: "shiv-shiva", interest: "shop", budget: "20-30", consent: true, openedAt: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("");
      expect(result.data.visitDate).toBe("");
      expect(result.data.message).toBe("");
      expect(result.data.website).toBe("");
    }
  });

  it("trims text fields", () => {
    const result = validateEnquiry({ ...valid, name: "  Asha Patel  ", message: "  hello  " });
    expect(result.ok && result.data.name).toBe("Asha Patel");
    expect(result.ok && result.data.message).toBe("hello");
  });

  it("reports the first error code for each field", () => {
    expect(errorsFor({ name: "" }).name).toBe("nameRequired");
    expect(errorsFor({ name: "A" }).name).toBe("nameShort");
    expect(errorsFor({ name: "A".repeat(81) }).name).toBe("nameLong");
    expect(errorsFor({ phone: "" }).phone).toBe("phoneRequired");
    expect(errorsFor({ phone: "12345" }).phone).toBe("phoneInvalid");
    expect(errorsFor({ email: "not-an-email" }).email).toBe("emailInvalid");
    expect(errorsFor({ project: "Not A Slug" }).project).toBe("projectInvalid");
    expect(errorsFor({ interest: "villa" }).interest).toBe("interestInvalid");
    expect(errorsFor({ budget: "free" }).budget).toBe("budgetInvalid");
    expect(errorsFor({ message: "x".repeat(1001) }).message).toBe("messageLong");
    expect(errorsFor({ consent: false }).consent).toBe("consentRequired");
  });

  it("accepts every interest and budget choice, a valid email and a mobile with a +91 prefix", () => {
    expect(errorsFor({ interest: "1bhk-flat", budget: "above-60", email: "asha@example.com", phone: "+91 98765 43210" })).toEqual({});
    expect(errorsFor({ interest: "3bhk-rowhouse", budget: "under-20" })).toEqual({});
  });

  it("falls back to the generic code for malformed values and missing required fields", () => {
    expect(errorsFor({ consent: undefined }).consent).toBe("generic");
    expect(errorsFor({ openedAt: undefined }).openedAt).toBe("generic");
    expect(errorsFor({ openedAt: "yesterday" }).openedAt).toBe("generic");
    expect(errorsFor({ plot: 0 }).plot).toBe("generic");
    expect(errorsFor({ plot: 166 }).plot).toBe("generic");
    expect(errorsFor({ unit: "u".repeat(61) }).unit).toBe("generic");
  });

  it("accepts plot, unit and source context", () => {
    const result = validateEnquiry({ ...valid, plot: 42, unit: "B3, floor 2", source: "/projects/shiv-shiva" });
    expect(result.ok).toBe(true);
  });

  it("keeps the honeypot value so the route can reject it", () => {
    const result = validateEnquiry({ ...valid, website: "http://spam.example" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.website).toBe("http://spam.example");
  });

  it("reports a body that is not an object as invalid", () => {
    expect(validateEnquiry(null).ok).toBe(false);
    expect(validateEnquiry("hello").ok).toBe(false);
  });

  it("strips unknown fields", () => {
    const result = validateEnquiry({ ...valid, isAdmin: true });
    expect(result.ok).toBe(true);
    if (result.ok) expect("isAdmin" in result.data).toBe(false);
  });

  it("has an English message for every error code", () => {
    for (const code of ERROR_CODES) {
      expect(en.enquiry.errors[code]).toBeTruthy();
    }
  });
});

describe("visit date", () => {
  it("treats an empty date as fine because it is optional", () => {
    expect(checkVisitDate("", NOW)).toBeNull();
    expect(errorsFor({ visitDate: "" })).toEqual({});
  });

  it("accepts today and later, up to a year ahead", () => {
    expect(checkVisitDate("2026-10-10", NOW)).toBeNull();
    expect(checkVisitDate("2026-12-25", NOW)).toBeNull();
    expect(checkVisitDate(addDaysIso("2026-10-10", MAX_VISIT_DAYS_AHEAD), NOW)).toBeNull();
  });

  it("rejects the past, the far future and impossible dates", () => {
    expect(checkVisitDate("2026-10-09", NOW)).toBe("visitDatePast");
    expect(checkVisitDate(addDaysIso("2026-10-10", MAX_VISIT_DAYS_AHEAD + 1), NOW)).toBe("visitDateFar");
    expect(checkVisitDate("2026-02-30", NOW)).toBe("visitDateInvalid");
    expect(checkVisitDate("10/10/2026", NOW)).toBe("visitDateInvalid");
    expect(checkVisitDate("tomorrow", NOW)).toBe("visitDateInvalid");
  });

  it("is checked by the schema with the current date", () => {
    expect(errorsFor({ visitDate: "2026-10-09" }).visitDate).toBe("visitDatePast");
    expect(errorsFor({ visitDate: "2026-10-12" })).toEqual({});
  });

  it("uses the date in India, so the client and the server agree", () => {
    // 18:29 UTC is 23:59 in India, 18:31 UTC is already the next day there.
    expect(todayInIndia(new Date("2026-10-10T18:29:00Z"))).toBe("2026-10-10");
    expect(todayInIndia(new Date("2026-10-10T18:31:00Z"))).toBe("2026-10-11");
    expect(todayInIndia(new Date("2026-10-09T19:00:00Z"))).toBe("2026-10-10");
  });

  it("parses and shifts ISO dates", () => {
    expect(parseIsoDate("2026-02-28")).toEqual({ year: 2026, month: 2, day: 28 });
    expect(parseIsoDate("2026-02-29")).toBeNull();
    expect(parseIsoDate("2028-02-29")).toEqual({ year: 2028, month: 2, day: 29 });
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysIso("not-a-date", 1)).toBe("not-a-date");
  });
});

describe("time trap", () => {
  it("rejects a submit under three seconds after the form opened", () => {
    expect(checkTimeTrap(1000, 1000 + MIN_FILL_MS - 1)).toBe("too-fast");
    expect(checkTimeTrap(1000, 1000)).toBe("too-fast");
  });

  it("accepts a submit at three seconds or later", () => {
    expect(checkTimeTrap(1000, 1000 + MIN_FILL_MS)).toBe("ok");
    expect(checkTimeTrap(1000, 1000 + 60 * 60 * 1000)).toBe("ok");
  });

  it("flags an open time far in the future as implausible but tolerates small clock skew", () => {
    expect(checkTimeTrap(1_000_000 + 10 * 60_000, 1_000_000)).toBe("implausible");
    expect(checkTimeTrap(1_000_000 + 30_000, 1_000_000)).toBe("too-fast");
  });
});

describe("toLead", () => {
  it("reduces the phone number to ten digits and keeps the rest", () => {
    const parsed = validateEnquiry({ ...valid, phone: "+91 98765-43210", plot: 7 });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      const lead = toLead(parsed.data);
      expect(lead.phone).toBe("9876543210");
      expect(lead.plot).toBe(7);
      expect(lead.project).toBe("shiv-shiva");
      expect("website" in lead).toBe(false);
      expect("openedAt" in lead).toBe(false);
    }
  });
});
