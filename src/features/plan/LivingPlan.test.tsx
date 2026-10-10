// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { plan } from "@/content/plan";
import { chapters } from "@/content/plan/chapters";

const device = vi.hoisted(() => ({ value: { tier: "C", ready: false, reducedMotion: false, finePointer: false, touch: false, webgl2: false, saveData: false, smoothScroll: false } }));
vi.mock("@/lib/device-tier-provider", () => ({ useDeviceTier: () => device.value }));
// GSAP and ScrollTrigger are exercised in the browser; jsdom tests mount the component with the effects switched off.
vi.mock("@/motion/hooks", async () => {
  const actual = await vi.importActual<typeof import("@/motion/hooks")>("@/motion/hooks");
  return { ...actual, useMotionEffect: () => undefined, useMotionGate: () => ({ enabled: false, rich: false, tier: "C", ready: false, reducedMotion: false }) };
});

import { LivingPlan } from "./LivingPlan";

let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
  cleanup();
});

const root = () => screen.getByRole("region", { name: "The Living Plan" });

describe("<LivingPlan> on the static tier", () => {
  it("renders the stage, the mix bar and the four typology keys without console errors", () => {
    render(<LivingPlan mode="story" />);
    expect(screen.getByRole("group", { name: /Site plan of Shiv Shiva Township/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Row houses 165, Flats 1,250, Shops 150, total 1,565/ })).toBeInTheDocument();
    const keys = within(screen.getByRole("group", { name: /Typologies/ })).getAllByRole("button");
    expect(keys.map((key) => key.getAttribute("aria-keyshortcuts"))).toEqual(["1", "2", "3", "4"]);
    expect(screen.getByText("1 building")).toBeInTheDocument();
  });

  it("draws every building and plot of the plan from content, with mixed use partnered with flats and shops", () => {
    const { container } = render(<LivingPlan mode="explore" />);
    expect(container.querySelectorAll("[data-building]")).toHaveLength(plan.buildings.length);
    expect(container.querySelectorAll("[data-plot]")).toHaveLength(165);
    const mixed = container.querySelector('[data-building="b1-b2"]');
    expect(mixed).toHaveAttribute("data-t", "mixed");
    expect(mixed).toHaveAttribute("data-also", "flats shops");
    expect(container.querySelector("#boundary")).toBeInTheDocument();
  });

  it("pins a typology on a tap, unpins on a second tap, clears on Escape and on an empty click", () => {
    render(<LivingPlan mode="explore" />);
    const keys = within(screen.getByRole("group", { name: /Typologies/ }));
    const flats = keys.getByRole("button", { name: /Flats/ });
    fireEvent.click(flats);
    expect(root()).toHaveAttribute("data-active", "flats");
    expect(flats).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(flats);
    expect(root()).toHaveAttribute("data-active", "");

    fireEvent.click(keys.getByRole("button", { name: /Shops/ }));
    expect(root()).toHaveAttribute("data-active", "shops");
    fireEvent.keyDown(root(), { key: "Escape" });
    expect(root()).toHaveAttribute("data-active", "");

    fireEvent.click(keys.getByRole("button", { name: /Row houses/ }));
    fireEvent.click(screen.getByRole("group", { name: /Site plan/ }));
    expect(root()).toHaveAttribute("data-active", "");
  });

  it("keys 1 to 4 pin Row houses, Flats, Shops and Mixed use; other keys and text fields are ignored", () => {
    render(<LivingPlan mode="explore" />);
    const stage = screen.getByRole("group", { name: /Site plan/ });
    const expected: Record<string, string> = { "1": "rowhouses", "2": "flats", "3": "shops", "4": "mixed" };
    for (const [digit, typology] of Object.entries(expected)) {
      fireEvent.keyDown(stage, { key: digit });
      expect(root()).toHaveAttribute("data-active", typology);
      fireEvent.keyDown(stage, { key: digit });
      expect(root()).toHaveAttribute("data-active", "");
    }
    fireEvent.keyDown(stage, { key: "5" });
    expect(root()).toHaveAttribute("data-active", "");
    fireEvent.keyDown(screen.getByLabelText("Plot number, 1 to 165"), { key: "2" });
    expect(root()).toHaveAttribute("data-active", "");
    fireEvent.keyDown(stage, { key: "2", ctrlKey: true });
    expect(root()).toHaveAttribute("data-active", "");
  });

  it("previews a typology while the pointer is over a footprint and lets go when it leaves", () => {
    const { container } = render(<LivingPlan mode="explore" />);
    const block = container.querySelector('[data-building="b18"]') as Element;
    fireEvent.pointerOver(block, { pointerType: "mouse" });
    expect(root()).toHaveAttribute("data-active", "flats");
    fireEvent.pointerOut(block, { pointerType: "mouse", relatedTarget: document.body });
    expect(root()).toHaveAttribute("data-active", "");
    fireEvent.pointerOver(block, { pointerType: "touch" });
    expect(root()).toHaveAttribute("data-active", "");
  });

  it("opens the plot card from a plot on the plan, with content from data, and closes it on Escape", () => {
    const { container } = render(<LivingPlan mode="explore" />);
    fireEvent.click(container.querySelector('[data-plot="50"]') as Element);
    const card = screen.getByRole("dialog", { name: "Plot 50" });
    expect(card).toBeInTheDocument();
    expect(within(card).getByText("Indicative, as per the current layout plan")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Enquire about plot 50" })).toBeInTheDocument();
    fireEvent.keyDown(root(), { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Plot 50" })).not.toBeInTheDocument();
  });

  it("goes to a plot by number and rejects numbers that are not on the plan", () => {
    render(<LivingPlan mode="explore" />);
    const input = screen.getByLabelText("Plot number, 1 to 165");
    fireEvent.change(input, { target: { value: "166" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(screen.getByRole("alert")).toHaveTextContent("There is no plot with that number.");
    fireEvent.change(input, { target: { value: "7" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(screen.getByRole("dialog", { name: "Plot 7" })).toBeInTheDocument();
  });

  it("lists the six chapters as text on the static tier, each with a button that shows it on the plan", () => {
    render(<LivingPlan mode="story" />);
    for (const chapter of chapters) {
      expect(screen.getByRole("heading", { name: chapter.title })).toBeInTheDocument();
    }
    fireEvent.click(screen.getAllByRole("button", { name: /Show on the plan/ })[4]);
    const hotspots = Array.from(document.querySelectorAll<HTMLElement>('.lp-hotspot[data-on="true"]'));
    expect(hotspots.length).toBe(chapters[4].hotspots.length);
    expect(hotspots.every((spot) => spot.dataset.chapter === "row-houses")).toBe(true);
  });

  it("has an accessible twin with the same zones, buildings and plots, reachable from a skip link", () => {
    render(<LivingPlan mode="explore" />);
    const twin = document.getElementById("lp-twin") as HTMLElement;
    expect(twin).toHaveClass("sr-only");
    expect(within(twin).getByRole("table", { name: "Buildings" })).toBeInTheDocument();
    expect(within(twin).getByRole("rowheader", { name: "165" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: /Skip the drawing/ }));
    expect(twin).not.toHaveClass("sr-only");
    fireEvent.click(within(twin).getByRole("button", { name: "Open plot 165" }));
    expect(screen.getByRole("dialog", { name: "Plot 165" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View the drawing" }));
    expect(twin).toHaveClass("sr-only");
  });
});

describe("<LivingPlan> on a capable device", () => {
  beforeEach(() => {
    device.value = { tier: "A", ready: true, reducedMotion: false, finePointer: true, touch: false, webgl2: true, saveData: false, smoothScroll: false };
  });
  afterEach(() => {
    device.value = { tier: "C", ready: false, reducedMotion: false, finePointer: false, touch: false, webgl2: false, saveData: false, smoothScroll: false };
  });

  it("pins the story, shows the intro card and offers to explore; the lens is on for a mouse", () => {
    const { container } = render(<LivingPlan mode="story" />);
    expect(root()).toHaveAttribute("data-story", "on");
    expect(screen.getByRole("heading", { name: "The whole township" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explore the plan" })).toBeInTheDocument();
    expect(container.querySelector(".lp-lens-photo")).toBeInTheDocument();
    expect(container.querySelectorAll(".lp-lens-photo image").length).toBeGreaterThan(0);
    // no plan chapters list while pinned
    expect(screen.queryByRole("button", { name: /Show on the plan/ })).not.toBeInTheDocument();
  });

  it("leaves the story when the visitor chooses to explore, and can go back", () => {
    render(<LivingPlan mode="story" />);
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    fireEvent.click(screen.getByRole("button", { name: "Explore the plan" }));
    expect(root()).toHaveAttribute("data-story", "off");
    expect(screen.getByRole("navigation", { name: "Plan chapters" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to the story" }));
    expect(root()).toHaveAttribute("data-story", "on");
  });

  it("zoom keys and arrow keys move the camera (instantly when motion is reduced)", () => {
    device.value = { ...device.value, reducedMotion: true };
    render(<LivingPlan mode="explore" />);
    const stage = screen.getByRole("group", { name: /Site plan/ });
    const group = stage.querySelector(".lp-cam") as SVGGElement;
    const before = group.getAttribute("transform");
    stage.focus();
    fireEvent.keyDown(stage, { key: "=" });
    expect(group.getAttribute("transform")).not.toBe(before);
    const zoomed = group.getAttribute("transform");
    fireEvent.keyDown(stage, { key: "ArrowLeft" });
    expect(group.getAttribute("transform")).not.toBe(zoomed);
    fireEvent.keyDown(stage, { key: "0" });
    expect(group.getAttribute("transform")).toBe(before);
  });
});
