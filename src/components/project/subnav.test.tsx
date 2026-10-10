// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SubNav } from "./SubNav";

type Callback = (entries: IntersectionObserverEntry[]) => void;
let trigger: Callback = () => undefined;
const observed: Element[] = [];

const items = [
  { id: "overview", label: "Overview" },
  { id: "plan", label: "Plan" },
  { id: "enquire", label: "Enquire" },
];

class FakeIntersectionObserver {
  constructor(callback: Callback) {
    trigger = callback;
  }
  observe(element: Element) {
    observed.push(element);
  }
  unobserve() {}
  disconnect() {
    observed.length = 0;
  }
}

class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function place(id: string, top: number) {
  const element = (id === "footer" ? document.querySelector("[data-site-footer]") : document.getElementById(id)) as HTMLElement;
  element.getBoundingClientRect = () => ({ top, bottom: top + 400, left: 0, right: 0, width: 0, height: 400, x: 0, y: top, toJSON: () => ({}) });
}

/** Positions of the sections relative to the viewport top, as a browser would report them. */
function layout(tops: { overview: number; plan: number; enquire: number; footer: number }) {
  for (const [id, top] of Object.entries(tops)) place(id, top);
}

beforeEach(() => {
  observed.length = 0;
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.stubGlobal("CSS", { escape: (value: string) => value });
  window.matchMedia = vi.fn(
    (query: string) => ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList,
  ) as unknown as typeof window.matchMedia;
  Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
  Element.prototype.scrollTo = () => undefined;
  document.body.innerHTML = `<section id="overview"></section><section id="plan"></section><section id="enquire"></section><footer data-site-footer></footer>`;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderNav() {
  return render(<SubNav items={items} label="On this page" />, { container: document.body.appendChild(document.createElement("div")) });
}

describe("SubNav", () => {
  it("is a plain list of anchors to the sections, so it works without JavaScript", () => {
    layout({ overview: 900, plan: 1500, enquire: 2200, footer: 3000 });
    renderNav();
    const nav = screen.getByRole("navigation", { name: "On this page" });
    const links = Array.from(nav.querySelectorAll("a"));
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["#overview", "#plan", "#enquire"]);
    expect(nav.className).toContain("sticky");
  });

  it("starts on the first item, with the underline placed under it", () => {
    layout({ overview: 900, plan: 1500, enquire: 2200, footer: 3000 });
    renderNav();
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("link", { name: "Plan" })).not.toHaveAttribute("aria-current");
    const bar = document.querySelector<HTMLElement>("[data-project-subnav] span[aria-hidden]");
    expect(bar?.style.transform).toMatch(/translateX\(.+\) scaleX\(.+\)/);
    expect(bar?.style.opacity).toBe("1");
  });

  it("watches every section and the footer", () => {
    layout({ overview: 900, plan: 1500, enquire: 2200, footer: 3000 });
    renderNav();
    expect(observed.map((element) => element.id || element.tagName.toLowerCase())).toEqual(["overview", "plan", "enquire", "footer"]);
  });

  it("marks the last section that has passed the reading line as current", () => {
    layout({ overview: 900, plan: 1500, enquire: 2200, footer: 3000 });
    renderNav();
    // Reading line is at 35% of an 800 px viewport: 280 px.
    layout({ overview: -900, plan: 120, enquire: 1400, footer: 3000 });
    act(() => trigger([]));
    expect(screen.getByRole("link", { name: "Plan" })).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  it("goes back to the first item when scrolled above every section", () => {
    layout({ overview: -900, plan: 120, enquire: 1400, footer: 3000 });
    renderNav();
    layout({ overview: 900, plan: 1500, enquire: 2200, footer: 3000 });
    act(() => trigger([]));
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "location");
  });

  it("treats the footer as the last item, even though the last section is short", () => {
    layout({ overview: 900, plan: 1500, enquire: 2200, footer: 3000 });
    renderNav();
    layout({ overview: -2000, plan: -1000, enquire: -300, footer: 200 });
    act(() => trigger([]));
    expect(screen.getByRole("link", { name: "Enquire" })).toHaveAttribute("aria-current", "location");
  });
});
