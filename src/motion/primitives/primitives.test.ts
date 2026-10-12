// @vitest-environment jsdom
/**
 * The reduced-motion paths of the primitives, and the exactness of the counter. These need no browser layout:
 * GSAP timelines run on the DOM in jsdom, and `progress(1)` jumps them to their end state. Plugin registration is
 * mocked out (ScrollTrigger and friends are not needed for these paths).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../setup", () => ({ registerMotion: vi.fn(), isMotionRegistered: () => true }));

import { boulevardWipe } from "./boulevard-wipe";
import { boundaryCurtain, CURTAIN_TIMING } from "./boundary-curtain";
import { countTo, dimensionCount } from "./dimension-count";
import { inkDraw } from "./ink-draw";
import { roundaboutIris } from "./roundabout-iris";
import { splitReveal } from "./split-reveal";
import { stripBlinds } from "./strip-blinds";

const SVG_NS = "http://www.w3.org/2000/svg";

function svg(markup: string): SVGSVGElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `<svg xmlns="${SVG_NS}">${markup}</svg>`;
  document.body.appendChild(wrapper);
  return wrapper.querySelector("svg") as SVGSVGElement;
}

function html(markup: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = markup;
  document.body.appendChild(wrapper);
  return wrapper.firstElementChild as HTMLElement;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("inkDraw", () => {
  it("reduced: fades the stroked shapes in and leaves skipped and non-rendered shapes alone", () => {
    const root = svg(`
      <defs><path id="def" d="M0 0L1 1"/></defs>
      <path id="a" d="M0 0L10 10"/>
      <g><line id="b" x1="0" y1="0" x2="5" y2="5"/></g>
      <path id="skip" data-ink-skip d="M0 0L2 2"/>
    `);
    const timeline = inkDraw(root, { reduced: true, paused: true });
    expect(root.querySelector("#a")?.getAttribute("style")).toContain("opacity: 0");
    timeline.progress(1);
    expect((root.querySelector("#a") as SVGElement).style.opacity).toBe("1");
    expect((root.querySelector("#b") as SVGElement).style.opacity).toBe("1");
    expect((root.querySelector("#def") as SVGElement).style.opacity).toBe("");
    expect((root.querySelector("#skip") as SVGElement).style.opacity).toBe("");
  });

  it("returns an empty timeline when there is nothing to draw", () => {
    const timeline = inkDraw(html("<div></div>"), { paused: true });
    expect(timeline.getChildren().length).toBe(0);
  });
});

describe("splitReveal", () => {
  it("reduced: fades the whole element and reverts cleanly", () => {
    const element = html("<h2>Drawn to life</h2>");
    const { timeline, revert } = splitReveal(element, { reduced: true, paused: true });
    expect(element.style.opacity).toBe("0");
    timeline.progress(1);
    expect(element.style.opacity).toBe("1");
    revert();
    expect(element.style.opacity).toBe("");
    expect(element.textContent).toBe("Drawn to life");
  });
});

describe("dimensionCount and countTo", () => {
  it("dimensionCount reduced: writes the final Indian-grouped value at once", () => {
    const root = svg('<line id="l" x1="0" y1="0" x2="10" y2="0"/><line id="t" x1="0" y1="0" x2="0" y2="5"/>');
    const output = html("<span>0</span>");
    const line = root.querySelector("#l") as SVGGeometryElement;
    const tick = root.querySelector("#t") as SVGGeometryElement;
    const timeline = dimensionCount({ line, ticks: [tick], output }, { value: 1250000, reduced: true, paused: true });
    expect(output.textContent).toBe("12,50,000");
    timeline.progress(1);
    expect(output.style.opacity).toBe("1");
  });

  it("countTo counts up and ends on the exact formatted value", () => {
    const output = html("<span>1,565</span>");
    const timeline = countTo(output, { value: 1565, paused: true });
    expect(output.textContent).toBe("0");
    timeline.progress(0.5);
    const mid = Number((output.textContent ?? "0").replace(/,/g, ""));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1565);
    timeline.progress(1);
    expect(output.textContent).toBe("1,565");
  });

  it("countTo supports decimals and custom formatters", () => {
    const decimals = html("<span></span>");
    countTo(decimals, { value: 12.5, decimals: 1, paused: true }).progress(1);
    expect(decimals.textContent).toBe("12.5");

    const custom = html("<span></span>");
    countTo(custom, { value: 7, format: (n) => `${n} homes`, paused: true }).progress(1);
    expect(custom.textContent).toBe("7 homes");
  });

  it("countTo reduced: final value and a fade", () => {
    const output = html("<span></span>");
    const timeline = countTo(output, { value: 165, reduced: true, paused: true });
    expect(output.textContent).toBe("165");
    timeline.progress(1);
    expect(output.style.opacity).toBe("1");
  });
});

describe("boundaryCurtain", () => {
  const curtain = () =>
    html(`<div class="pi-curtain"><div data-curtain-panel></div><span data-curtain-label></span><span data-curtain-eyebrow></span><span data-curtain-rule></span></div>`);

  it("reduced cover: fades in, blocks clicks, and reports the page as covered exactly once", () => {
    const root = curtain();
    const onCovered = vi.fn();
    const timeline = boundaryCurtain(root, { phase: "cover", reduced: true, paused: true, onCovered });
    timeline.progress(1);
    expect(root.style.opacity).toBe("1");
    expect(root.style.visibility).not.toBe("hidden");
    expect(root.style.pointerEvents).toBe("auto");
    expect(onCovered).toHaveBeenCalledTimes(1);
  });

  it("reduced reveal: fades out and hides the curtain", () => {
    const root = curtain();
    boundaryCurtain(root, { phase: "cover", reduced: true, paused: true }).progress(1);
    const timeline = boundaryCurtain(root, { phase: "reveal", reduced: true, paused: true });
    timeline.progress(1);
    expect(root.style.opacity).toBe("0");
    expect(root.style.visibility).toBe("hidden");
    expect(root.style.pointerEvents).toBe("none");
  });

  it("panel variant: calls onCovered when the panel has covered the page, and hides the curtain after the reveal", () => {
    const root = curtain();
    const onCovered = vi.fn();
    const cover = boundaryCurtain(root, { phase: "cover", variant: "panel", paused: true, onCovered });
    cover.progress(1);
    expect(onCovered).toHaveBeenCalledTimes(1);
    expect(root.style.visibility).not.toBe("hidden");
    boundaryCurtain(root, { phase: "reveal", variant: "panel", paused: true }).progress(1);
    expect(root.style.visibility).toBe("hidden");
    expect(root.style.pointerEvents).toBe("none");
  });

  it("keeps cover, title and reveal quick: the panel round trip stays under 0.95 s", () => {
    const root = curtain();
    const cover = boundaryCurtain(root, { phase: "cover", variant: "panel", paused: true });
    const reveal = boundaryCurtain(root, { phase: "reveal", variant: "panel", paused: true });
    expect(cover.duration() + reveal.duration()).toBeLessThanOrEqual(0.95);
  });

  it("hole timings are quick too, and the title is readable before the page is revealed", () => {
    expect(CURTAIN_TIMING.hole.cover + CURTAIN_TIMING.hole.reveal + CURTAIN_TIMING.revealDelay).toBeLessThanOrEqual(0.9);
    const titleEnd = CURTAIN_TIMING.hole.cover * CURTAIN_TIMING.titleStart + CURTAIN_TIMING.titleIn;
    expect(titleEnd).toBeLessThanOrEqual(0.5);
  });

  it("falls back to the panel when no hole is given", () => {
    const root = curtain();
    const onCovered = vi.fn();
    boundaryCurtain(root, { phase: "cover", paused: true, onCovered }).progress(1);
    expect(onCovered).toHaveBeenCalledTimes(1);
  });
});

describe("boulevardWipe, stripBlinds and roundaboutIris (reduced)", () => {
  it("boulevardWipe fades the line in", () => {
    const line = html('<div class="line"></div>');
    const timeline = boulevardWipe(line, { reduced: true, paused: true });
    expect(line.style.opacity).toBe("0");
    timeline.progress(1);
    expect(line.style.opacity).toBe("1");
  });

  it("boulevardWipe in reveal mode fades the line and the content", () => {
    const block = html('<div><span data-wipe-line></span><div data-wipe-content>hello</div></div>');
    boulevardWipe(block, { reduced: true, paused: true }).progress(1);
    expect((block.querySelector("[data-wipe-line]") as HTMLElement).style.opacity).toBe("1");
    expect((block.querySelector("[data-wipe-content]") as HTMLElement).style.opacity).toBe("1");
  });

  it("stripBlinds fades the pictures in and never sets a clip", () => {
    const frames = [html("<figure></figure>"), html("<figure></figure>")];
    const timeline = stripBlinds(frames, { reduced: true, paused: true });
    timeline.progress(1);
    for (const frame of frames) {
      expect(frame.style.opacity).toBe("1");
      expect(frame.style.clipPath).toBe("");
    }
  });

  it("stripBlinds with nothing to animate returns an empty timeline", () => {
    expect(stripBlinds([], { paused: true }).getChildren().length).toBe(0);
  });

  it("roundaboutIris fades in on open and out (hidden) on close", () => {
    const frame = html("<div>picture</div>");
    roundaboutIris(frame, { phase: "close", reduced: true, paused: true }).progress(1);
    expect(frame.style.opacity).toBe("0");
    expect(frame.style.visibility).toBe("hidden");
    roundaboutIris(frame, { phase: "open", reduced: true, paused: true }).progress(1);
    expect(frame.style.opacity).toBe("1");
    expect(frame.style.visibility).not.toBe("hidden");
  });
});
