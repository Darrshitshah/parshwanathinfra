/**
 * Resolve a plan reference to a point on the render grid. Owner: data-lead.
 *
 * A reference is the id of the element in the web plan SVG (public/plan/shiv-shiva-plan.svg), so a chapter hotspot,
 * a pin and an SVG node all use one name:
 *   b-<building id> · plot-<n> · road-<road id> · g-<garden id> · a-<amenity id> · e-<entry id> · district-<district id>
 */
import type { Point } from "../schema";
import { labelPoint, pointAlong, polygonCentroid } from "./geometry";
import { plan } from "./index";

function prefixed(ref: string, prefix: string): string | undefined {
  return ref.startsWith(prefix) ? ref.slice(prefix.length) : undefined;
}

export function refPoint(ref: string, along = 0.5): Point | undefined {
  const id = prefixed(ref, "b-");
  if (id !== undefined) {
    const building = plan.buildings.find((b) => b.id === id);
    return building ? labelPoint(building.polygon) : undefined;
  }
  const plotNumber = prefixed(ref, "plot-");
  if (plotNumber !== undefined) {
    const plot = plan.plots.find((p) => String(p.number) === plotNumber);
    return plot ? (polygonCentroid(plot.polygon).map((v) => Math.round(v * 10) / 10) as Point) : undefined;
  }
  const roadId = prefixed(ref, "road-");
  if (roadId !== undefined) {
    const road = plan.roads.find((r) => r.id === roadId);
    return road ? (pointAlong(road.centerline, along).map((v) => Math.round(v * 10) / 10) as Point) : undefined;
  }
  const gardenId = prefixed(ref, "g-");
  if (gardenId !== undefined) {
    const garden = plan.gardens.find((g) => g.id === gardenId);
    return garden ? labelPoint(garden.polygon) : undefined;
  }
  const amenityId = prefixed(ref, "a-");
  if (amenityId !== undefined) return plan.amenities.find((a) => a.id === amenityId)?.point;
  const entryId = prefixed(ref, "e-");
  if (entryId !== undefined) return plan.entries.find((e) => e.id === entryId)?.point;
  const districtId = prefixed(ref, "district-");
  if (districtId !== undefined) {
    const district = plan.districts.find((d) => d.id === districtId);
    return district ? labelPoint(district.polygon) : undefined;
  }
  return undefined;
}

export function refExists(ref: string): boolean {
  return refPoint(ref) !== undefined;
}
