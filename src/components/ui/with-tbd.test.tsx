// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TBD } from "@/content/schema";
import { Tbd, TBD_TOKEN } from "./Tbd";
import { rich, TbdValue, withTbd } from "./with-tbd";

afterEach(cleanup);

describe("Tbd", () => {
  it("renders a visible chip that announces itself as to be confirmed", () => {
    render(<Tbd />);
    const chip = screen.getByText("TBD", { exact: false });
    expect(chip.closest("[data-tbd]")).not.toBeNull();
    expect(chip.closest("[data-tbd]")?.getAttribute("title")).toBe("To be confirmed");
    expect(screen.getByText("(to be confirmed)", { exact: false })).toBeInTheDocument();
  });

  it("uses the same literal as the content layer", () => {
    expect(TBD_TOKEN).toBe(TBD);
  });
});

describe("withTbd", () => {
  it("returns plain text untouched", () => {
    expect(withTbd("Plain text")).toBe("Plain text");
  });

  it("turns the standalone word TBD into a chip", () => {
    const { container } = render(<p>{withTbd("Floors: TBD and more")}</p>);
    expect(container.querySelectorAll("[data-tbd]")).toHaveLength(1);
    expect(container.textContent).toContain("Floors: ");
    expect(container.textContent).toContain(" and more");
  });

  it("does not touch words that merely contain TBD", () => {
    const { container } = render(<p>{withTbd("TBDX is not a gap")}</p>);
    expect(container.querySelectorAll("[data-tbd]")).toHaveLength(0);
  });
});

describe("rich", () => {
  it("returns plain text untouched", () => {
    expect(rich("Plain text")).toBe("Plain text");
  });

  it("renders starred words as emphasis", () => {
    const { container } = render(<p>{rich("On *one plan* only")}</p>);
    expect(container.querySelector("em")?.textContent).toBe("one plan");
    expect(container.textContent).toBe("On one plan only");
  });

  it("keeps tilded words together without showing the tildes", () => {
    const { container } = render(<p>{rich("Go to ~North Gate~ now")}</p>);
    expect(container.querySelector(".whitespace-nowrap")?.textContent).toBe("North Gate");
    expect(container.textContent).toBe("Go to North Gate now");
  });

  it("never breaks Vapi-Silvassa Road at its hyphen, wherever it appears", () => {
    const { container } = render(<p>{rich("A township on the Vapi-Silvassa Road: flats and shops")}</p>);
    expect(container.querySelector(".whitespace-nowrap")?.textContent).toBe("Vapi-Silvassa Road");
    expect(container.textContent).toBe("A township on the Vapi-Silvassa Road: flats and shops");
  });

  it("handles a chip, emphasis and a protected phrase in one string", () => {
    const { container } = render(<p>{rich("Open *lawn* near the Vapi-Silvassa Road, area TBD")}</p>);
    expect(container.querySelectorAll("em")).toHaveLength(1);
    expect(container.querySelectorAll(".whitespace-nowrap")).toHaveLength(1);
    expect(container.querySelectorAll("[data-tbd]")).toHaveLength(1);
  });
});

describe("TbdValue", () => {
  it("shows the chip for the literal TBD", () => {
    const { container } = render(<TbdValue value="TBD" />);
    expect(container.querySelectorAll("[data-tbd]")).toHaveLength(1);
  });

  it("shows the chip for a missing value", () => {
    const { container } = render(<TbdValue value={undefined} />);
    expect(container.querySelectorAll("[data-tbd]")).toHaveLength(1);
  });

  it("shows a confirmed value as is, or formatted by the render function", () => {
    const plain = render(<TbdValue value="RERA/123" />);
    expect(plain.container.textContent).toBe("RERA/123");
    plain.unmount();
    const formatted = render(<TbdValue value={2024}>{(year) => `Since ${year}`}</TbdValue>);
    expect(formatted.container.textContent).toBe("Since 2024");
  });
});
