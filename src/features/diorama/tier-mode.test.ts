import { describe, expect, it } from "vitest";
import { pickDioramaMode } from "./tier-mode";

const base = { tier: "A", ready: true, reducedMotion: false, webgl2: true } as const;

describe("pickDioramaMode", () => {
  it("Tier A with WebGL2 gets the 3D scene", () => expect(pickDioramaMode(base)).toBe("webgl"));
  it("Tier A without WebGL2 falls back to the sequence", () => expect(pickDioramaMode({ ...base, webgl2: false })).toBe("sequence"));
  it("Tier B gets the image sequence, even with WebGL2", () => expect(pickDioramaMode({ ...base, tier: "B" })).toBe("sequence"));
  it("Tier C gets the still", () => expect(pickDioramaMode({ ...base, tier: "C" })).toBe("still"));
  it("reduced motion gets the still on any tier", () => {
    expect(pickDioramaMode({ ...base, reducedMotion: true })).toBe("still");
    expect(pickDioramaMode({ ...base, tier: "B", reducedMotion: true })).toBe("still");
  });
  it("renders the still until the tier is known (server and first client render)", () => expect(pickDioramaMode({ ...base, ready: false })).toBe("still"));
});
