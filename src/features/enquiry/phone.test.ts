import { describe, expect, it } from "vitest";
import { formatPhone, INDIAN_MOBILE_PATTERN, normalizePhone } from "./phone";

const EN_DASH = String.fromCharCode(0x2013);
const EM_DASH = String.fromCharCode(0x2014);
const NBSP = String.fromCharCode(0x00a0);

describe("normalizePhone", () => {
  it.each([
    ["9876543210", "9876543210"],
    ["98765 43210", "9876543210"],
    ["98765-43210", "9876543210"],
    ["98765.43210", "9876543210"],
    ["(98765) 43210", "9876543210"],
    ["  98765 43210  ", "9876543210"],
    ["+91 98765 43210", "9876543210"],
    ["+91-98765-43210", "9876543210"],
    ["+919876543210", "9876543210"],
    ["(+91) 98765 43210", "9876543210"],
    ["09876543210", "9876543210"],
    ["0 98765 43210", "9876543210"],
    ["919876543210", "9876543210"],
    ["91 98765 43210", "9876543210"],
    ["0091 98765 43210", "9876543210"],
    ["6000000000", "6000000000"],
    ["7000000000", "7000000000"],
    ["8999999999", "8999999999"],
    // A ten-digit number that merely starts with 91 is a real mobile number and is kept whole.
    ["9198765432", "9198765432"],
  ])("accepts %j as %j", (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });

  it("ignores typographic dashes and non-breaking spaces people paste", () => {
    expect(normalizePhone(`98765${EN_DASH}43210`)).toBe("9876543210");
    expect(normalizePhone(`98765${EM_DASH}43210`)).toBe("9876543210");
    expect(normalizePhone(`+91${NBSP}98765${NBSP}43210`)).toBe("9876543210");
  });

  it.each([
    "",
    "   ",
    "abc",
    "98765x43210",
    "98765 4321",
    "98765432101",
    "987654321",
    "5876543210",
    "1234567890",
    "0987654321",
    "91987654321",
    "+91",
    "+91 98765 4321",
    "+1 9876543210",
    "+44 7911 123456",
    "+91 0 9876543210",
    "00 98765 43210",
    "9876543210 ext 5",
  ])("rejects %j", (raw) => {
    expect(normalizePhone(raw)).toBeNull();
  });

  it("only ever returns ten digits that satisfy the Indian mobile pattern", () => {
    for (const raw of ["9876543210", "+91 6000000000", "08123456789"]) {
      const result = normalizePhone(raw);
      expect(result).not.toBeNull();
      expect(INDIAN_MOBILE_PATTERN.test(result ?? "")).toBe(true);
    }
  });
});

describe("formatPhone", () => {
  it("groups ten digits for display", () => {
    expect(formatPhone("9876543210")).toBe("+91 98765 43210");
  });

  it("leaves anything that is not ten digits unchanged", () => {
    expect(formatPhone("98765")).toBe("98765");
    expect(formatPhone("")).toBe("");
  });
});
