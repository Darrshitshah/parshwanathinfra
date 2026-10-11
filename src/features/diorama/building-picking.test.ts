import { Group, Mesh } from "three";
import { describe, expect, it } from "vitest";
import { buildingIdFromName, buildingIdOf } from "./building-picking";

const known = new Set(["b18", "rh-strip-01", "b1-b2"]);

describe("building picking", () => {
  it("maps node names to plan ids", () => {
    expect(buildingIdFromName("b-b18", known)).toBe("b18");
    expect(buildingIdFromName("b-b18_1", known)).toBe("b18");
    expect(buildingIdFromName("b-b1-b2", known)).toBe("b1-b2");
    expect(buildingIdFromName("plots-rh-strip-01", known)).toBe("rh-strip-01");
  });

  it("ignores everything that is not a building", () => {
    for (const name of ["tree-001", "car-02", "ground-site", "b-unknown", "a-clubhouse-sector-05"]) {
      expect(buildingIdFromName(name, known), name).toBeUndefined();
    }
  });

  it("finds the building from a child mesh", () => {
    const group = new Group();
    group.name = "b-b18";
    const mesh = new Mesh();
    mesh.name = "something";
    group.add(mesh);
    expect(buildingIdOf(mesh, known)).toBe("b18");
    expect(buildingIdOf(new Mesh(), known)).toBeUndefined();
  });
});
