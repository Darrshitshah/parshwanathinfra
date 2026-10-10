import { describe, expect, it } from "vitest";
import { resolveTransitionTitle, ROOT_TITLE, titleFromPath } from "./titles";

function link(attributes: Record<string, string>) {
  return { getAttribute: (name: string) => attributes[name] ?? null };
}

describe("titleFromPath", () => {
  it("names the home page after the company", () => {
    expect(titleFromPath("/")).toBe(ROOT_TITLE);
    expect(titleFromPath("")).toBe(ROOT_TITLE);
  });

  it("title-cases the last path segment", () => {
    expect(titleFromPath("/about")).toBe("About");
    expect(titleFromPath("/projects/shiv-shiva")).toBe("Shiv Shiva");
    expect(titleFromPath("/projects/shiv-shiva/")).toBe("Shiv Shiva");
  });

  it("keeps acronyms in capitals", () => {
    expect(titleFromPath("/legal/rera-disclaimer")).toBe("RERA Disclaimer");
  });

  it("copes with encoded segments, extensions and odd input", () => {
    expect(titleFromPath("/site%20visit")).toBe("Site Visit");
    expect(titleFromPath("/brochure.html")).toBe("Brochure");
    expect(titleFromPath("/%E0%A4%A")).toBeTypeOf("string");
    expect(titleFromPath("/---")).toBe(ROOT_TITLE);
  });
});

describe("resolveTransitionTitle", () => {
  const url = new URL("http://localhost:3000/contact");

  it("prefers the explicit data attribute", () => {
    expect(resolveTransitionTitle(link({ "data-transition-title": "Plan a visit" }), url)).toBe("Plan a visit");
  });

  it("collapses whitespace and caps the length", () => {
    expect(resolveTransitionTitle(link({ "data-transition-title": "  Plan \n  a   visit " }), url)).toBe("Plan a visit");
    expect(resolveTransitionTitle(link({ "data-transition-title": "x".repeat(200) }), url)).toHaveLength(60);
  });

  it("falls back to the destination path, never the link text", () => {
    expect(resolveTransitionTitle(link({}), url)).toBe("Contact");
    expect(resolveTransitionTitle(link({ "data-transition-title": "   " }), url)).toBe("Contact");
  });
});
