import { describe, expect, it } from "vitest";
import { firstName, formatVisitDate, whatsappLink } from "./format";

describe("formatVisitDate", () => {
  it("writes the weekday and the full date", () => {
    expect(formatVisitDate("2026-10-18")).toBe("Sunday, 18 October 2026");
    expect(formatVisitDate("2027-01-01")).toBe("Friday, 1 January 2027");
  });

  it("does not shift the day with the time zone of the machine", () => {
    // Midnight UTC would be the previous day in the Americas if this used local time.
    expect(formatVisitDate("2026-10-10")).toBe("Saturday, 10 October 2026");
  });

  it("returns an empty string when there is no usable date", () => {
    expect(formatVisitDate("")).toBe("");
    expect(formatVisitDate("2026-02-30")).toBe("");
    expect(formatVisitDate("soon")).toBe("");
  });
});

describe("firstName", () => {
  it("takes the first word", () => {
    expect(firstName("Asha Patel")).toBe("Asha");
    expect(firstName("  Rahul   Kumar Shah ")).toBe("Rahul");
    expect(firstName("Meera")).toBe("Meera");
    expect(firstName("")).toBe("");
  });
});

describe("whatsappLink", () => {
  it("builds a wa.me link with the India country code", () => {
    expect(whatsappLink("9876543210")).toBe("https://wa.me/919876543210");
  });

  it("encodes the prefilled text", () => {
    expect(whatsappLink("9876543210", "Hello & welcome")).toBe("https://wa.me/919876543210?text=Hello%20%26%20welcome");
  });
});
