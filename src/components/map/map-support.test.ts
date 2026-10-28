// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { canShowLiveMap } from "./map-support";

function windowWith(context: unknown, saveData = false): Window {
  const canvas = { getContext: vi.fn(() => context) };
  return {
    navigator: { connection: { saveData } },
    document: { createElement: () => canvas },
  } as unknown as Window;
}

afterEach(() => vi.restoreAllMocks());

describe("canShowLiveMap", () => {
  it("needs WebGL", () => {
    expect(canShowLiveMap(windowWith({}))).toBe(true);
    expect(canShowLiveMap(windowWith(null))).toBe(false);
  });

  it("respects save-data", () => {
    expect(canShowLiveMap(windowWith({}, true))).toBe(false);
  });

  it("treats a throwing canvas as no WebGL", () => {
    const broken = { navigator: {}, document: { createElement: () => { throw new Error("no canvas"); } } } as unknown as Window;
    expect(canShowLiveMap(broken)).toBe(false);
  });
});
