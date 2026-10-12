// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { plan } from "@/content/plan";
import { PlotCard, plotCardContent } from "./PlotCard";

afterEach(cleanup);

describe("plot card content", () => {
  it("reads type, status and confidence from the plan and inventory", () => {
    expect(plotCardContent(1)).toEqual({ number: 1, storeys: 2, typeLabel: null, statusLabel: null, indicative: false, interest: "not-sure" });
    expect(plotCardContent(80)).toMatchObject({ number: 80, indicative: true });
    expect(plotCardContent(0)).toBeNull();
    expect(plotCardContent(166)).toBeNull();
  });

  it("covers every plot of the plan and flags exactly the low-confidence ones as indicative", () => {
    const flagged = plan.plots.filter((plot) => plotCardContent(plot.number)?.indicative);
    expect(flagged.map((plot) => plot.number)).toEqual(plan.plots.filter((plot) => plot.numberConfidence === "low").map((plot) => plot.number));
    expect(plan.plots.every((plot) => plotCardContent(plot.number) !== null)).toBe(true);
  });
});

describe("<PlotCard>", () => {
  it("shows the plot number, TBD type and status, the elevation and the enquiry action", () => {
    render(<PlotCard number={12} onClose={() => undefined} />);
    const card = screen.getByRole("dialog", { name: "Plot 12" });
    expect(within(card).getAllByText("TBD", { exact: false }).length).toBeGreaterThanOrEqual(2);
    expect(within(card).getByRole("img", { name: /Two-storey flat-roofed row houses by day/ })).toBeInTheDocument();
    expect(within(card).getByText("2 storeys + terrace")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Enquire about plot 12" })).toBeInTheDocument();
    expect(within(card).queryByText("Indicative, as per the current layout plan")).not.toBeInTheDocument();
  });

  it("marks plots read from the photo as indicative", () => {
    render(<PlotCard number={90} onClose={() => undefined} />);
    expect(screen.getByText("Indicative, as per the current layout plan")).toBeInTheDocument();
  });

  it("closes from its button", () => {
    const onClose = vi.fn();
    render(<PlotCard number={5} onClose={onClose} />);
    screen.getByRole("button", { name: "Close" }).click();
    expect(onClose).toHaveBeenCalled();
  });

  it("renders nothing for a number that is not a plot", () => {
    const { container } = render(<PlotCard number={999} onClose={() => undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
