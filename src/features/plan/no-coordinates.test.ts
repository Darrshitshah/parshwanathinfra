import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { plan } from "@/content/plan";

/**
 * Geometry lives only in content. These checks fail if a coordinate pair from plan.json, an SVG path, or a points
 * list is typed into a component or helper of the plan or explorer features.
 */
const roots = [join(process.cwd(), "src/features/plan"), join(process.cwd(), "src/features/explorer")];

function sources(): Array<{ file: string; text: string }> {
  return roots.flatMap((dir) =>
    readdirSync(dir)
      .filter((name) => /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name))
      .map((name) => {
        const raw = readFileSync(join(dir, name), "utf8");
        // strip comments so documentation may mention numbers
        const text = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
        return { file: `${dir.split("/").slice(-2).join("/")}/${name}`, text };
      }),
  );
}

function allPoints(): Array<[number, number]> {
  const points: Array<[number, number]> = [
    ...plan.boundary,
    ...plan.buildings.flatMap((b) => b.polygon),
    ...plan.plots.flatMap((p) => p.polygon),
    ...plan.roads.flatMap((r) => [...r.centerline, ...(r.polygon ?? [])]),
    ...plan.gardens.flatMap((g) => g.polygon),
    ...plan.amenities.map((a) => a.point),
    ...plan.entries.map((e) => e.point),
    plan.roundabout.center,
  ];
  return points as Array<[number, number]>;
}

describe("no coordinates in components", () => {
  const files = sources();

  it("scans the plan and explorer sources", () => {
    expect(files.length).toBeGreaterThan(15);
  });

  it("never contains a coordinate pair of the plan", () => {
    const pairs = new Set(allPoints().filter(([x, y]) => Math.abs(x) >= 10 && Math.abs(y) >= 10).map(([x, y]) => `${x}${y}`));
    const hits: string[] = [];
    for (const { file, text } of files) {
      for (const match of text.matchAll(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/g)) {
        if (pairs.has(`${match[1]}${match[2]}`)) hits.push(`${file}: ${match[0]}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("never types an SVG path, a points list or a plan-sized viewBox", () => {
    const bad: string[] = [];
    for (const { file, text } of files) {
      if (/\bd="[MmLlHhVvCcZz]\s*-?\d/.test(text)) bad.push(`${file}: path data`);
      if (/\bpoints=["{]/.test(text)) bad.push(`${file}: points`);
      if (/viewBox=["']\s*-?\d+\s+-?\d+\s+(?:[5-9]\d\d|\d{4})/.test(text)) bad.push(`${file}: viewBox`);
      if (/<polygon|<polyline/.test(text)) bad.push(`${file}: polygon element`);
    }
    expect(bad).toEqual([]);
  });

  it("takes the default view and the grid from the plan, not from literals", () => {
    const stage = files.find((f) => f.file.endsWith("plan/LivingPlan.tsx"))!.text;
    expect(stage).toContain("plan.grid.viewBox");
    expect(stage).not.toMatch(/\b2000\b|\b1342\b/);
  });
});
