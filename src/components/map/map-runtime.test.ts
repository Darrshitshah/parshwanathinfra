// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { prefersReducedMotion, readMapTokens, watchTheme } from "./map-runtime";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("data-theme");
});

describe("readMapTokens", () => {
  it("resolves every token the browser computes to hex and removes its probe", () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ color: "rgb(35, 26, 18)" } as CSSStyleDeclaration);
    const tokens = readMapTokens(document.body);
    expect(tokens?.ink).toBe("#231a12");
    expect(Object.values(tokens ?? {})).toHaveLength(10);
    expect(document.body.children).toHaveLength(0);
  });

  it("gives up (so the schematic stays) when a token cannot be read", () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ color: "" } as CSSStyleDeclaration);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(readMapTokens()).toBeNull();
  });
});

describe("watchTheme", () => {
  it("reports a theme toggle on html[data-theme] once per frame, and stops when asked", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const onChange = vi.fn();
    const stop = watchTheme(onChange);
    document.documentElement.dataset.theme = "dark";
    document.documentElement.dataset.theme = "light";
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    stop();
    document.documentElement.dataset.theme = "dark";
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("reads the reduced-motion preference", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    expect(prefersReducedMotion()).toBe(true);
  });
});
