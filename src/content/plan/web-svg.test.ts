import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { hasForbiddenDash } from "../schema";
import { plan } from "./index";

const svg = readFileSync(join(process.cwd(), "public", "plan", "shiv-shiva-plan.svg"), "utf8");
const ids = new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const MAX_GZIP_BYTES = 120 * 1024;

describe("web plan SVG", () => {
  it("stays under 120 KB gzipped", () => {
    expect(gzipSync(svg).length).toBeLessThan(MAX_GZIP_BYTES);
  });

  it("has an id for every plan element, named like the plan data", () => {
    const expected = [
      "boundary",
      "roundabout",
      ...plan.buildings.map((building) => `b-${building.id}`),
      ...plan.plots.map((plot) => `plot-${plot.number}`),
      ...plan.roads.map((road) => `road-${road.id}`),
      ...plan.gardens.map((garden) => `g-${garden.id}`),
      ...plan.amenities.map((amenity) => `a-${amenity.id}`),
      ...plan.entries.map((entry) => `e-${entry.id}`),
      ...plan.districts.map((district) => `district-${district.id}`),
    ];
    const missing = expected.filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
  });

  it("has no id that plan.json does not know", () => {
    const groups = new Set(["districts", "gardens", "roads", "boundary", "plots", "amenities", "entries", "roundabout"]);
    const known = new Set(
      [...plan.buildings.map((b) => `b-${b.id}`), ...plan.plots.map((p) => `plot-${p.number}`)].concat(
        plan.roads.map((r) => `road-${r.id}`),
        plan.gardens.map((g) => `g-${g.id}`),
        plan.amenities.map((a) => `a-${a.id}`),
        plan.entries.map((e) => `e-${e.id}`),
        plan.districts.map((d) => `district-${d.id}`),
      ),
    );
    const strangers = [...ids].filter((id) => !known.has(id) && !groups.has(id) && !id.startsWith("typology-"));
    expect(strangers).toEqual([]);
  });

  it("has one group per typology in use", () => {
    for (const typology of new Set(plan.buildings.map((building) => building.typology))) {
      expect(ids.has(`typology-${typology}`), typology).toBe(true);
    }
  });

  it("carries no inline colours or styles, so the page tokens style it", () => {
    expect(svg).not.toMatch(/\sstyle=/);
    expect(svg).not.toMatch(/(?:fill|stroke|stop-color|color)="(?!none|currentColor|inherit)[^"]*"/);
    expect(svg).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(svg).not.toMatch(/<style|<script|<image|<text/);
  });

  it("uses non-scaling strokes on outlines", () => {
    expect(svg).toContain('vector-effect="non-scaling-stroke"');
    expect(svg).toMatch(/id="boundary"[^>]*vector-effect="non-scaling-stroke"|vector-effect="non-scaling-stroke"[^>]*id="boundary"/);
  });

  it("keeps the CAD title block and private text out, and has no em or en dashes", () => {
    expect(hasForbiddenDash(svg)).toBe(false);
    expect(svg).not.toMatch(/AUTODESK|PRODUCED BY|LAYOUT PLAN|\.dwg/i);
  });

  it("uses the plan's default crop as its viewBox", () => {
    const [x, y, w, h] = plan.grid.viewBox;
    expect(svg).toContain(`viewBox="${x} ${y} ${w} ${h}"`);
  });
});
