/**
 * Guards the initial-bundle budget (BUILD_SPEC section 11: home route under 200 KB gzipped JavaScript).
 *
 * GSAP and its plugins are about 50 KB gzipped, so nothing a page imports statically may reach them: the "thin layer"
 * below only talks to the GSAP runtime through `loadMotion()` (a dynamic import). This test walks the STATIC import
 * graph (dynamic `import()` calls are not followed, `import type` is erased) from each thin entry point and fails if it
 * reaches `gsap`, `@gsap/react`, `lenis`, or one of the heavy motion modules.
 *
 * If it fails: you imported something heavy from a thin module. Use `import type`, move the code behind
 * `loadMotion()` / `useMotionEffect`, or import constants from `@/motion/constants`.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const SRC = join(ROOT, "src");

/** Entry points that ship in the initial bundle of (nearly) every route. */
const THIN_ENTRY_POINTS = [
  "motion/MotionRoot.tsx",
  "motion/hooks.ts",
  "motion/Reveal.tsx",
  "motion/load.ts",
  "motion/scroll.ts",
  "motion/township.ts",
  "motion/constants.ts",
  "components/transition/index.ts",
  "components/loader/index.ts",
  "components/cursor/index.ts",
];

/** Modules that import GSAP statically; they may only be reached through `loadMotion()`. */
const HEAVY_FILES = new Set(
  ["motion/setup.ts", "motion/lazy.ts", "motion/effects.ts", "motion/runtime.ts", "motion/index.ts"].map((file) => join(SRC, file)),
);
const HEAVY_DIRECTORIES = [join(SRC, "motion", "primitives")];
const BANNED_PACKAGES = /^(gsap|@gsap\/react|lenis)(\/|$)/;

interface Graph {
  files: Set<string>;
  packages: Set<string>;
}

function resolveModule(from: string, specifier: string): string | null {
  const base = specifier.startsWith("@/") ? join(SRC, specifier.slice(2)) : specifier.startsWith(".") ? resolve(dirname(from), specifier) : null;
  if (!base) return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Runtime (non-type) static import and re-export specifiers of one file. */
function staticSpecifiers(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const specifiers: string[] = [];
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const clause = statement.importClause;
      if (clause?.isTypeOnly) continue;
      const named = clause?.namedBindings;
      const onlyInlineTypes =
        clause !== undefined &&
        !clause.name &&
        named !== undefined &&
        ts.isNamedImports(named) &&
        named.elements.length > 0 &&
        named.elements.every((element) => element.isTypeOnly);
      if (!onlyInlineTypes) specifiers.push(statement.moduleSpecifier.text);
    } else if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      if (statement.isTypeOnly) continue;
      const named = statement.exportClause;
      const onlyInlineTypes =
        named !== undefined && ts.isNamedExports(named) && named.elements.length > 0 && named.elements.every((element) => element.isTypeOnly);
      if (!onlyInlineTypes) specifiers.push(statement.moduleSpecifier.text);
    }
  }
  return specifiers;
}

function walk(entry: string): Graph {
  const files = new Set<string>();
  const packages = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (files.has(file) || !/\.tsx?$/.test(file)) continue;
    files.add(file);
    for (const specifier of staticSpecifiers(file)) {
      const target = resolveModule(file, specifier);
      if (target) queue.push(target);
      else if (!specifier.startsWith(".") && !specifier.startsWith("@/")) packages.add(specifier);
    }
  }
  return { files, packages };
}

function isHeavy(file: string): boolean {
  return HEAVY_FILES.has(file) || HEAVY_DIRECTORIES.some((directory) => file.startsWith(directory + "/"));
}

describe("the thin layer never statically reaches GSAP", () => {
  it.each(THIN_ENTRY_POINTS)("%s", (entry) => {
    const graph = walk(join(SRC, entry));
    const bannedPackages = [...graph.packages].filter((name) => BANNED_PACKAGES.test(name));
    const heavyFiles = [...graph.files].filter(isHeavy).map((file) => relative(SRC, file));
    expect({ bannedPackages, heavyFiles }).toEqual({ bannedPackages: [], heavyFiles: [] });
  });
});

describe("the guard catches mistakes", () => {
  function inScratch<T>(files: Record<string, string>, run: (directory: string) => T): T {
    const directory = mkdtempSync(join(tmpdir(), "boundary-"));
    try {
      for (const [name, text] of Object.entries(files)) writeFileSync(join(directory, name), text);
      return run(directory);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }

  it("flags a static import of gsap, even through another file", () => {
    const graph = inScratch(
      { "a.ts": 'import { b } from "./b";\nexport const a = b;', "b.ts": 'import { gsap } from "gsap";\nexport const b = gsap;' },
      (directory) => walk(join(directory, "a.ts")),
    );
    expect([...graph.packages].filter((name) => BANNED_PACKAGES.test(name))).toEqual(["gsap"]);
  });

  it("flags a static import of a heavy motion module", () => {
    const graph = inScratch({ "a.ts": 'import { inkDraw } from "@/motion/primitives/ink-draw";\nexport const a = inkDraw;' }, (directory) =>
      walk(join(directory, "a.ts")),
    );
    expect([...graph.files].some(isHeavy)).toBe(true);
  });

  it("does not flag a dynamic import, a type import or an all-inline-type import", () => {
    const graph = inScratch(
      {
        "a.ts": [
          'import type { Timeline } from "@/motion/types";',
          'import { type SplitUnit } from "@/motion/primitives/split-reveal";',
          'export type { SplitUnit } from "@/motion/primitives/split-reveal";',
          'export const load = () => import("gsap");',
          "export type T = Timeline;",
        ].join("\n"),
      },
      (directory) => walk(join(directory, "a.ts")),
    );
    expect([...graph.packages].filter((name) => BANNED_PACKAGES.test(name))).toEqual([]);
    expect([...graph.files].some(isHeavy)).toBe(false);
  });
});

describe("the guard itself", () => {
  it("sees GSAP from the heavy runtime (so a pass above means something)", () => {
    const graph = walk(join(SRC, "motion", "runtime.ts"));
    expect([...graph.packages].some((name) => name === "gsap")).toBe(true);
    expect([...graph.packages].some((name) => name === "gsap/ScrollTrigger")).toBe(true);
  });

  it("follows the thin layer's real dependencies", () => {
    const graph = walk(join(SRC, "motion", "MotionRoot.tsx"));
    const names = [...graph.files].map((file) => relative(SRC, file));
    expect(names).toContain("components/transition/TransitionProvider.tsx");
    expect(names).toContain("components/transition/controller.ts");
    expect(names).toContain("motion/load.ts");
    // Reached only through dynamic imports, so not part of the static graph.
    expect(names).not.toContain("components/cursor/Cursor.tsx");
    expect(names).not.toContain("motion/runtime.ts");
  });

  it("treats a heavy module imported only as a type as erased", () => {
    const graph = walk(join(SRC, "motion", "hooks.ts"));
    expect([...graph.files].map((file) => relative(SRC, file))).not.toContain("motion/primitives/split-reveal.ts");
  });
});
