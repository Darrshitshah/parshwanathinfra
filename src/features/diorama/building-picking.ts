import type { Object3D } from "three";

/** Plan building id for a mesh hit in the GLB: nodes are named `b-<id>` (building) or `plots-<strip id>` (row-house tiles). */
export function buildingIdFromName(name: string, known: ReadonlySet<string>): string | undefined {
  const id = name.startsWith("b-") ? name.slice(2) : name.startsWith("plots-") ? name.slice(6) : undefined;
  if (!id) return undefined;
  // glTF loaders suffix extra primitives of one mesh with _1, _2 ...
  const base = known.has(id) ? id : id.replace(/_\d+$/, "");
  return known.has(base) ? base : undefined;
}

/** Walk up from a hit object to the named node and return its building id. */
export function buildingIdOf(object: Object3D | null, known: ReadonlySet<string>): string | undefined {
  for (let node: Object3D | null = object; node; node = node.parent) {
    const id = buildingIdFromName(node.name, known);
    if (id) return id;
  }
  return undefined;
}
