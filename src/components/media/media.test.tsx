// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { planCallouts, rowHouseCallouts } from "@/content/copy/callouts";
import { getMedia } from "@/content/media";
import { CalloutLegend } from "./CalloutLegend";
import { Figure } from "./Figure";

afterEach(cleanup);

describe("Figure", () => {
  const render1 = getMedia("row-houses-day");

  it("renders the image with its real alt text, the media's own aspect ratio and a blur placeholder", () => {
    const { container } = render(<Figure media={render1} sizes="100vw" />);
    const image = screen.getByRole("img", { name: render1.alt });
    expect(image).toBeInTheDocument();
    const frame = container.querySelector<HTMLElement>("figure > div > div");
    expect(frame?.style.aspectRatio.replace(/\s/g, "")).toBe(`${render1.width}/${render1.height}`);
    expect(image.getAttribute("style")).toContain("background-image");
  });

  it("labels every render as an artist's impression, and nothing else", () => {
    const { container, rerender } = render(<Figure media={render1} sizes="100vw" />);
    expect(container.querySelector(".tag-impression")?.textContent).toBe("Artist's impression");
    rerender(<Figure media={getMedia("shiv-shiva-logo")} sizes="100vw" />);
    expect(container.querySelector(".tag-impression")).toBeNull();
  });

  it("can take its size from the caller instead of the media", () => {
    const { container } = render(<Figure media={render1} sizes="100vw" aspect={null} frameClassName="aspect-[3/2]" />);
    const frame = container.querySelector<HTMLElement>("figure > div > div");
    expect(frame?.style.aspectRatio).toBe("");
    expect(frame).toHaveClass("aspect-[3/2]");
  });

  it("shows the media's caption, or a caption of the caller's own", () => {
    const { rerender } = render(<Figure media={render1} sizes="100vw" caption />);
    expect(screen.getByText(render1.caption ?? "")).toBeInTheDocument();
    rerender(<Figure media={render1} sizes="100vw" caption="My caption" />);
    expect(screen.getByText("My caption")).toBeInTheDocument();
  });

  it("preloads the LCP image with high priority and carries data attributes on the img itself", () => {
    const { container } = render(<Figure media={render1} sizes="100vw" preload imageData={{ "data-hero-image": "" }} />);
    const image = container.querySelector("img");
    expect(image?.getAttribute("fetchpriority")).toBe("high");
    expect(image?.getAttribute("loading")).toBe("eager");
    expect(image).toHaveAttribute("data-hero-image");
  });

  it("lazy-loads everything else", () => {
    const { container } = render(<Figure media={render1} sizes="100vw" />);
    expect(container.querySelector("img")?.getAttribute("loading")).toBe("lazy");
  });

  it("leaves the alt empty for pure decoration", () => {
    const { container } = render(<Figure media={render1} sizes="100vw" decorative />);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
  });

  it("hides decorative callouts from assistive technology and numbers them in order", () => {
    const { container } = render(<Figure media={render1} sizes="100vw" callouts={rowHouseCallouts} />);
    const layer = container.querySelector("[data-callouts]");
    expect(layer).toHaveAttribute("aria-hidden", "true");
    const pins = Array.from(layer?.querySelectorAll(".callout__pin") ?? []).map((pin) => pin.textContent);
    expect(pins).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
    const first = layer?.querySelector<HTMLElement>(".callout");
    expect(first?.style.getPropertyValue("--x")).toBe(`${rowHouseCallouts[0]?.x}%`);
  });

  it("can show callouts on large screens only", () => {
    const { container } = render(<Figure media={render1} sizes="100vw" callouts={planCallouts.slice(0, 1)} calloutsDesktopOnly />);
    expect(container.querySelector("[data-callouts]")).toHaveClass("hidden", "lg:block");
  });
});

describe("callout data", () => {
  it("keeps every callout inside the image", () => {
    for (const item of [...planCallouts, ...rowHouseCallouts]) {
      expect(item.x).toBeGreaterThan(0);
      expect(item.x).toBeLessThan(100);
      expect(item.y).toBeGreaterThan(0);
      expect(item.y).toBeLessThan(100);
    }
  });

  it("derives the entry and roundabout positions from the plan, not from literals", () => {
    const entry = planCallouts.find((item) => item.id === "main-entry");
    const roundabout = planCallouts.find((item) => item.id === "roundabout");
    // Main entry (1892, 652) and roundabout centre (1320, 651) on the 2000 x 1342 render grid.
    expect(entry?.x).toBeCloseTo((1892 / 2000) * 100, 1);
    expect(entry?.y).toBeCloseTo((652 / 1342) * 100, 1);
    expect(roundabout?.x).toBeCloseTo((1320 / 2000) * 100, 1);
  });
});

describe("CalloutLegend", () => {
  it("lists each callout in the same order as the pins, with TBD as a chip", () => {
    const withTbd = [...planCallouts, { ...planCallouts[0], id: "tbd-sample", label: "Sample", detail: "Upper floors: TBD." }];
    const { container } = render(<CalloutLegend items={withTbd} label="Marked on the plan" />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(withTbd.length);
    expect(items[0]).toHaveTextContent("Main entry.");
    expect(screen.getByRole("list", { name: "Marked on the plan" })).toBeInTheDocument();
    expect(container.querySelector("[data-tbd]")).not.toBeNull();
  });
});
