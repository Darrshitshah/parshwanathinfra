import { describe, expect, it } from "vitest";
import {
  activeFilter,
  alsoFor,
  digitToFilter,
  filterReducer,
  filterRole,
  FILTERS,
  INITIAL_FILTER,
  type FilterAction,
  type FilterState,
} from "./filter-state";

const run = (actions: FilterAction[], from: FilterState = INITIAL_FILTER) => actions.reduce(filterReducer, from);

describe("typology filter", () => {
  it("keys 1 to 4 map to row houses, flats, shops and mixed use", () => {
    expect(FILTERS.map((filter) => [filter.n, filter.key])).toEqual([
      [1, "rowhouses"],
      [2, "flats"],
      [3, "shops"],
      [4, "mixed"],
    ]);
    expect(digitToFilter("1")).toBe("rowhouses");
    expect(digitToFilter("4")).toBe("mixed");
    expect(digitToFilter("5")).toBeNull();
    expect(digitToFilter("a")).toBeNull();
  });

  it("previews on hover and lets go on unhover", () => {
    const hovered = run([{ type: "hover", key: "flats" }]);
    expect(activeFilter(hovered)).toBe("flats");
    expect(activeFilter(run([{ type: "hover", key: "flats" }, { type: "unhover" }]))).toBeNull();
  });

  it("a tap pins, a second tap unpins, and the pin survives the pointer leaving", () => {
    const pinned = run([{ type: "hover", key: "shops" }, { type: "tap", key: "shops" }, { type: "unhover" }]);
    expect(pinned.pin).toBe("shops");
    expect(activeFilter(pinned)).toBe("shops");
    expect(run([{ type: "tap", key: "shops" }], pinned).pin).toBeNull();
  });

  it("hover previews another typology over a pin, then returns to the pin", () => {
    const pinned = run([{ type: "tap", key: "flats" }]);
    expect(activeFilter(run([{ type: "hover", key: "rowhouses" }], pinned))).toBe("rowhouses");
    expect(activeFilter(run([{ type: "hover", key: "rowhouses" }, { type: "unhover" }], pinned))).toBe("flats");
  });

  it("digit keys pin and toggle", () => {
    const pinned = run([{ type: "digit", digit: "2" }]);
    expect(pinned.pin).toBe("flats");
    expect(run([{ type: "digit", digit: "2" }], pinned).pin).toBeNull();
    expect(run([{ type: "digit", digit: "9" }], pinned)).toBe(pinned);
  });

  it("an empty click clears the pin, Escape clears everything", () => {
    const pinned = run([{ type: "tap", key: "rowhouses" }, { type: "hover", key: "flats" }]);
    expect(run([{ type: "emptyClick" }], pinned)).toEqual({ hover: "flats", pin: null });
    expect(run([{ type: "clear" }], pinned)).toEqual(INITIAL_FILTER);
    expect(run([{ type: "clear" }])).toBe(INITIAL_FILTER);
  });

  it("mixed use lights up partially with flats and shops, and is dimmed by row houses", () => {
    const mixedAlso = alsoFor("mixed");
    expect(mixedAlso).toEqual(["flats", "shops"]);
    expect(filterRole("flats", "mixed", mixedAlso)).toBe("part");
    expect(filterRole("shops", "mixed", mixedAlso)).toBe("part");
    expect(filterRole("rowhouses", "mixed", mixedAlso)).toBe("dim");
    expect(filterRole("mixed", "mixed", mixedAlso)).toBe("on");
    expect(filterRole("mixed", "flats", alsoFor("flats"))).toBe("dim");
    expect(filterRole(null, "flats")).toBe("idle");
  });
});
