/**
 * Darshit's rule: no em dashes (U+2014) or en dashes (U+2013) anywhere in src/ or docs/ (BUILD_SPEC 13).
 * Owner: Director.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const SCANNED = ["src", "docs", "README.md"];
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".css", ".svg", ".txt", ".html"]);
const DASHES = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);

function listFiles(path: string): string[] {
  let stats;
  try {
    stats = statSync(path);
  } catch {
    return [];
  }
  if (stats.isFile()) return TEXT_EXTENSIONS.has(extname(path)) ? [path] : [];
  return readdirSync(path).flatMap((name) => listFiles(join(path, name)));
}

describe("no em or en dashes", () => {
  it("finds none in src/, docs/ or README.md", () => {
    const offenders: string[] = [];
    for (const entry of SCANNED) {
      for (const file of listFiles(join(ROOT, entry))) {
        const lines = readFileSync(file, "utf8").split("\n");
        lines.forEach((line, index) => {
          if (DASHES.test(line)) offenders.push(`${relative(ROOT, file)}:${index + 1}`);
        });
      }
    }
    expect(offenders).toEqual([]);
  });
});
