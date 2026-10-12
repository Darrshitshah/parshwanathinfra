import { describe, expect, it } from "vitest";
import { buildingFromSearch } from "./ExplorerSlot";

describe("buildingFromSearch", () => {
  it("reads a block id from ?building=", () => {
    expect(buildingFromSearch("?building=b18")).toBe("b18");
    expect(buildingFromSearch("?x=1&building=b1-b2")).toBe("b1-b2");
  });

  it("ignores a missing, empty or malformed value", () => {
    expect(buildingFromSearch("")).toBeUndefined();
    expect(buildingFromSearch("?building=")).toBeUndefined();
    expect(buildingFromSearch("?building=B18")).toBeUndefined();
    expect(buildingFromSearch("?building=<script>")).toBeUndefined();
    expect(buildingFromSearch(`?building=${"a".repeat(41)}`)).toBeUndefined();
  });
});
