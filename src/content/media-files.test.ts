import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { media } from "./media";

describe("media files", () => {
  it("exist in public/ with exactly the width and height declared in media.ts", async () => {
    for (const item of media) {
      const file = join(process.cwd(), "public", item.src);
      expect(existsSync(file), item.src).toBe(true);
      const meta = await sharp(file).metadata();
      expect({ id: item.id, w: meta.width, h: meta.height }).toEqual({ id: item.id, w: item.width, h: item.height });
    }
  });

  it("flags every render as an artist's impression and gives every image alt text", () => {
    for (const item of media) {
      expect(item.alt.length, item.id).toBeGreaterThan(10);
      if (item.kind === "render" || item.kind === "clay-render" || item.kind === "generated") {
        expect(item.artistImpression, item.id).toBe(true);
      }
    }
  });
});
