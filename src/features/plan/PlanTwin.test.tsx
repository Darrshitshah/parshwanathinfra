// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanTwin } from "./PlanTwin";

const noop = vi.fn();
afterEach(cleanup);

function scrollRegions(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(".lp-table-wrap"));
}

describe("PlanTwin scroll regions", () => {
  it("are keyboard focusable and named once the list view is shown", () => {
    const { container } = render(<PlanTwin shown onOpenBuilding={noop} onOpenPlot={noop} />);
    const regions = scrollRegions(container);
    expect(regions.length).toBeGreaterThan(0);
    for (const region of regions) {
      expect(region).toHaveAttribute("tabindex", "0");
      expect(region).toHaveAttribute("aria-label");
    }
  });

  it("have no tab stop while the twin is hidden (nothing scrolls there)", () => {
    const { container } = render(<PlanTwin shown={false} onOpenBuilding={noop} onOpenPlot={noop} />);
    for (const region of scrollRegions(container)) {
      expect(region).not.toHaveAttribute("tabindex");
    }
  });
});
