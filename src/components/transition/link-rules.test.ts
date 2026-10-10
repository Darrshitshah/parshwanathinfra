// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { evaluateClick, findAnchor, toRouterHref, type ClickLike, type LocationLike } from "./link-rules";

const location: LocationLike = { href: "http://localhost:3000/projects", origin: "http://localhost:3000" };

const click: ClickLike = {
  defaultPrevented: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
};

function anchor(href: string, attributes: Record<string, string> = {}): HTMLAnchorElement {
  const element = document.createElement("a");
  element.setAttribute("href", href);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  document.body.appendChild(element);
  return element;
}

beforeEach(() => {
  document.body.innerHTML = "";
  // Relative hrefs resolve against the document URL, so keep it in step with `location` above.
  window.history.replaceState({}, "", "/projects");
});

describe("evaluateClick: what the curtain takes over", () => {
  it("takes a plain internal link", () => {
    const decision = evaluateClick(anchor("/about"), click, location);
    expect(decision.kind).toBe("transition");
    if (decision.kind === "transition") expect(toRouterHref(decision.url)).toBe("/about");
  });

  it("keeps the query and fragment for the router", () => {
    const decision = evaluateClick(anchor("/projects/shiv-shiva?tab=plan#row-houses"), click, location);
    expect(decision.kind).toBe("transition");
    if (decision.kind === "transition") expect(toRouterHref(decision.url)).toBe("/projects/shiv-shiva?tab=plan#row-houses");
  });

  it("takes an absolute same-origin link", () => {
    expect(evaluateClick(anchor("http://localhost:3000/contact"), click, location).kind).toBe("transition");
  });

  it("accepts target=_self", () => {
    expect(evaluateClick(anchor("/about", { target: "_self" }), click, location).kind).toBe("transition");
  });
});

describe("evaluateClick: what it never intercepts", () => {
  const cases: Array<[string, () => ReturnType<typeof evaluateClick>, string]> = [
    ["no link under the click", () => evaluateClick(null, click, location), "no-anchor"],
    ["a click someone already cancelled", () => evaluateClick(anchor("/about"), { ...click, defaultPrevented: true }, location), "default-prevented"],
    ["middle and right buttons", () => evaluateClick(anchor("/about"), { ...click, button: 1 }, location), "not-primary-button"],
    ["cmd or ctrl click (new tab)", () => evaluateClick(anchor("/about"), { ...click, metaKey: true }, location), "modifier-key"],
    ["ctrl click", () => evaluateClick(anchor("/about"), { ...click, ctrlKey: true }, location), "modifier-key"],
    ["shift click (new window)", () => evaluateClick(anchor("/about"), { ...click, shiftKey: true }, location), "modifier-key"],
    ["alt click (download)", () => evaluateClick(anchor("/about"), { ...click, altKey: true }, location), "modifier-key"],
    ["target=_blank", () => evaluateClick(anchor("/about", { target: "_blank" }), click, location), "new-context"],
    ["named targets", () => evaluateClick(anchor("/about", { target: "frame" }), click, location), "new-context"],
    ["download links", () => evaluateClick(anchor("/brochure", { download: "" }), click, location), "download"],
    ["opted-out links", () => evaluateClick(anchor("/about", { "data-transition-ignore": "" }), click, location), "opted-out"],
    ["links that behave as buttons", () => evaluateClick(anchor("/contact", { role: "button" }), click, location), "interactive-role"],
    ["drawer triggers", () => evaluateClick(anchor("/contact", { "aria-controls": "drawer" }), click, location), "interactive-role"],
    ["rel=external", () => evaluateClick(anchor("/partner", { rel: "noopener external" }), click, location), "external-rel"],
    ["mailto links", () => evaluateClick(anchor("mailto:hello@example.com"), click, location), "unsupported-protocol"],
    ["tel links", () => evaluateClick(anchor("tel:+910000000000"), click, location), "unsupported-protocol"],
    ["javascript: links", () => evaluateClick(anchor("javascript:void(0)"), click, location), "unsupported-protocol"],
    ["external sites", () => evaluateClick(anchor("https://example.com/about"), click, location), "cross-origin"],
    ["another port", () => evaluateClick(anchor("http://localhost:3001/about"), click, location), "cross-origin"],
    ["same-origin pdfs", () => evaluateClick(anchor("/files/brochure.pdf"), click, location), "file-link"],
    ["same-origin images", () => evaluateClick(anchor("/media/cover.WEBP"), click, location), "file-link"],
    ["the page you are already on", () => evaluateClick(anchor("/projects"), click, location), "same-url"],
    ["an empty fragment", () => evaluateClick(anchor("#"), click, location), "same-url"],
  ];

  it.each(cases)("%s", (_name, run, reason) => {
    expect(run()).toEqual({ kind: "native", reason });
  });

  it("honours data-transition-ignore on an ancestor", () => {
    const wrapper = document.createElement("nav");
    wrapper.setAttribute("data-transition-ignore", "");
    const link = document.createElement("a");
    link.setAttribute("href", "/about");
    wrapper.appendChild(link);
    document.body.appendChild(wrapper);
    expect(evaluateClick(link, click, location)).toEqual({ kind: "native", reason: "opted-out" });
  });
});

describe("evaluateClick: same-page fragments", () => {
  it("reports a #fragment on the current page as a hash scroll", () => {
    const decision = evaluateClick(anchor("#plan"), click, location);
    expect(decision.kind).toBe("hash");
    if (decision.kind === "hash") expect(decision.url.hash).toBe("#plan");
  });

  it("treats /current-path#fragment the same way", () => {
    expect(evaluateClick(anchor("/projects#plan"), click, location).kind).toBe("hash");
  });

  it("transitions when only the fragment is new but the path differs", () => {
    expect(evaluateClick(anchor("/about#team"), click, location).kind).toBe("transition");
  });

  it("leaves a query-only change on the same route to Next (no pathname change, so nothing to wait for)", () => {
    expect(evaluateClick(anchor("/projects?tab=2"), click, location)).toEqual({ kind: "native", reason: "same-path" });
    expect(evaluateClick(anchor("/projects?tab=2#plan"), click, location)).toEqual({ kind: "native", reason: "same-path" });
  });

  it("still transitions when the route differs and only the query is new", () => {
    expect(evaluateClick(anchor("/about?tab=2"), click, location).kind).toBe("transition");
  });
});

describe("findAnchor", () => {
  it("finds the link around a click target", () => {
    const link = anchor("/about");
    const inner = document.createElement("span");
    link.appendChild(inner);
    expect(findAnchor(inner)).toBe(link);
  });

  it("ignores targets that are not inside a link, and anchors without href", () => {
    expect(findAnchor(document.body)).toBeNull();
    expect(findAnchor(null)).toBeNull();
    const bare = document.createElement("a");
    document.body.appendChild(bare);
    expect(findAnchor(bare)).toBeNull();
  });
});
