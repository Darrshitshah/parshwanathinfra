// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StagePoster } from "./StagePoster";

afterEach(cleanup);

describe("StagePoster", () => {
  it("covers the stage until the live scene has drawn", () => {
    const { container } = render(<StagePoster drawn={false} />);
    const poster = container.querySelector("[data-stage-poster]");
    expect(poster?.getAttribute("data-stage-poster")).toBe("shown");
    expect(poster?.className).toContain("opacity-100");
    expect(poster?.className).toContain("pointer-events-none");
    expect(poster?.getAttribute("aria-hidden")).toBe("true");
  });

  it("fades out and is hidden once drawn, then unmounts after the fade", () => {
    const { container, rerender } = render(<StagePoster drawn={false} />);
    rerender(<StagePoster drawn />);
    const poster = container.querySelector("[data-stage-poster]");
    expect(poster?.getAttribute("data-stage-poster")).toBe("hidden");
    expect(poster?.className).toContain("invisible");
    expect(poster?.className).toContain("opacity-0");
    fireEvent.transitionEnd(poster as Element, { propertyName: "opacity" });
    expect(container.querySelector("[data-stage-poster]")).toBeNull();
  });
});
