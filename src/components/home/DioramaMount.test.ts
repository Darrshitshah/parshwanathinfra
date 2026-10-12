import { describe, expect, it } from "vitest";
import { explorerHref } from "./DioramaMount";

describe("explorerHref", () => {
  it("opens the building in the project page explorer", () => {
    expect(explorerHref("b18")).toBe("/projects/shiv-shiva?building=b18#homes");
    expect(explorerHref("b1-b2")).toBe("/projects/shiv-shiva?building=b1-b2#homes");
  });
});
