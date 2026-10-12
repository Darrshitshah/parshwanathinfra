// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getUnitType } from "@/content/units";

vi.mock("@/motion/hooks", () => ({
  useMotionEffect: () => undefined,
  useMotionGate: () => ({ enabled: false, rich: false, tier: "C", ready: false, reducedMotion: false }),
}));

import { BuildingExplorer } from "./BuildingExplorer";
import { BuildingExplorerDialog } from "./BuildingExplorerDialog";
import { loadUnitSvg } from "./UnitPlan";

const planSvg = (path: string) => readFileSync(join(process.cwd(), "public", path), "utf8");

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string) => ({ ok: true, status: 200, text: async () => planSvg(path) })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("<BuildingExplorer>", () => {
  it("shows the confirmed floors, one selectable band per floor and a Terrace band that cannot be selected", () => {
    const { container } = render(<BuildingExplorer buildingId="b18" />);
    expect(screen.getByRole("heading", { name: "Block B18" })).toBeInTheDocument();
    expect(screen.getByText("Floors: Ground + 5")).toBeInTheDocument();
    expect(screen.queryByText(/TBD|indicative|to be confirmed/i, { selector: ".ex-floors *, .ex-figure p" })).toBeNull();
    const bands = Array.from(container.querySelectorAll("[data-band]"));
    expect(bands).toHaveLength(6);
    // drawn top to bottom, so the 5th floor comes first in the markup
    expect(bands.map((band) => band.querySelector("text")?.textContent).reverse()).toEqual(["Ground", "1st floor", "2nd floor", "3rd floor", "4th floor", "5th floor"]);
    const terrace = container.querySelector("[data-terrace]") as SVGGElement;
    expect(terrace.querySelector("text")).toHaveTextContent("Terrace");
    expect(terrace).not.toHaveAttribute("role", "button");
    expect(terrace).not.toHaveAttribute("tabindex");
    fireEvent.click(terrace);
    expect(screen.getByText("Choose a floor to see its homes.")).toBeInTheDocument();
    expect(screen.getByText("Availability on request")).toBeInTheDocument();
  });

  it("lights a band on focus and selects a floor on click, listing its units as TBD with the plans we can show", () => {
    const { container } = render(<BuildingExplorer buildingId="b18" />);
    expect(screen.getByText("Choose a floor to see its homes.")).toBeInTheDocument();
    const third = container.querySelector('[data-band="2"]') as SVGGElement;
    expect(third).toHaveAttribute("aria-label", "2nd floor, to be confirmed");
    fireEvent.click(third);
    expect(third).toHaveAttribute("aria-pressed", "true");
    expect(third).toHaveClass("is-selected");
    expect(screen.getByRole("heading", { name: "2nd floor" })).toBeInTheDocument();
    expect(screen.getByText("Units on this floor:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Typical flat, plan 473/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Draw this plan/ })).toHaveLength(2);
    fireEvent.click(third);
    expect(third).toHaveAttribute("aria-pressed", "false");
  });

  it("moves between floors with the arrow keys and selects with Enter", () => {
    const { container } = render(<BuildingExplorer buildingId="b18" />);
    const first = container.querySelector('[data-band="0"]') as SVGGElement;
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowUp" });
    expect(document.activeElement).toBe(container.querySelector('[data-band="1"]'));
    fireEvent.keyDown(document.activeElement as Element, { key: "Enter" });
    expect(container.querySelector('[data-band="1"]')).toHaveAttribute("aria-pressed", "true");
  });

  it("draws a chosen plan with its rooms and sizes in mono, and offers to enquire about the home", async () => {
    const { container } = render(<BuildingExplorer buildingId="b1-b2" />);
    fireEvent.click(container.querySelector('[data-band="1"]') as SVGGElement);
    fireEvent.click(screen.getByRole("button", { name: /Typical flat, plan 473/ }));
    await waitFor(() => expect(container.querySelector(".ex-plan__drawing svg")).toBeInTheDocument());
    const rooms = within(container.querySelector(".ex-rooms") as HTMLElement).getAllByRole("listitem");
    const expected = getUnitType("flat-473")!.rooms;
    expect(rooms).toHaveLength(expected.length);
    expect(rooms[0]).toHaveTextContent(`${expected[0].name}${expected[0].width} x ${expected[0].length}`);
    expect(screen.getByRole("button", { name: "Enquire about this home" })).toBeInTheDocument();
    expect(screen.getAllByText("TBD", { exact: false }).length).toBeGreaterThan(0);
  });

  it("renders nothing for an unknown block and a plain message when a block has no floor count", () => {
    const { container, rerender } = render(<BuildingExplorer buildingId="nope" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<BuildingExplorer buildingId="office" />);
    expect(screen.getByText("Floors: TBD")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-band]")).toHaveLength(0);
  });
});

describe("unit plan loading", () => {
  it("only fetches the plans that ship with the site", async () => {
    await expect(loadUnitSvg("https://example.com/x.svg")).rejects.toThrow();
    await expect(loadUnitSvg("/plan/units/../../secret.svg")).rejects.toThrow();
    const text = await loadUnitSvg("/plan/units/flat-large.svg");
    expect(text.startsWith("<svg")).toBe(true);
  });
});

describe("<BuildingExplorerDialog>", () => {
  it("is a modal dialog that closes on Escape and from its button", () => {
    const onClose = vi.fn();
    render(<BuildingExplorerDialog buildingId="b18" onClose={onClose} />);
    const dialog = screen.getByRole("dialog", { name: "Building explorer" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
