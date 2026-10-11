import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { chapters } from "@/content/plan/chapters";
import { buildStations } from "./stations";
import { FRAME_COUNT, frameIndexAt, frameUrl, frameUrls, MODEL_URL, nearestLoaded, stillUrl } from "./frames";

const publicFile = (url: string) => path.join(process.cwd(), "public", url);
const MAX_FRAME_BYTES = 60 * 1024;
const MAX_SEQUENCE_BYTES = 4 * 1024 * 1024;
const MAX_STILL_BYTES = 250 * 1024;
const MAX_MODEL_BYTES = 2.5 * 1024 * 1024;

describe("frame list", () => {
  it("is 48 to 72 frames, numbered from 001 without gaps", () => {
    expect(FRAME_COUNT).toBeGreaterThanOrEqual(48);
    expect(FRAME_COUNT).toBeLessThanOrEqual(72);
    const urls = frameUrls();
    expect(urls[0]).toBe("/sequences/diorama/frame-001.webp");
    expect(new Set(urls).size).toBe(FRAME_COUNT);
    expect(urls.at(-1)).toBe(`/sequences/diorama/frame-${String(FRAME_COUNT).padStart(3, "0")}.webp`);
  });

  it("clamps frame numbers and maps progress to an index", () => {
    expect(frameUrl(0)).toBe(frameUrl(1));
    expect(frameUrl(999)).toBe(frameUrl(FRAME_COUNT));
    expect(frameIndexAt(0)).toBe(0);
    expect(frameIndexAt(1)).toBe(FRAME_COUNT - 1);
    expect(frameIndexAt(2)).toBe(FRAME_COUNT - 1);
  });

  it("finds the nearest loaded frame", () => {
    expect(nearestLoaded(10, new Set())).toBe(-1);
    expect(nearestLoaded(10, new Set([10]))).toBe(10);
    expect(nearestLoaded(10, new Set([0, 1, 2, 14]))).toBe(14);
    expect(nearestLoaded(10, new Set([8, 13]))).toBe(8);
  });
});

describe("files on disk", () => {
  it("has every frame, each under 60 KB, and the sequence under 4 MB", () => {
    let total = 0;
    for (const url of frameUrls()) {
      const file = publicFile(url);
      expect(existsSync(file), url).toBe(true);
      const size = statSync(file).size;
      expect(size, url).toBeLessThanOrEqual(MAX_FRAME_BYTES);
      total += size;
    }
    expect(total).toBeLessThanOrEqual(MAX_SEQUENCE_BYTES);
  });

  it("has a still per station, each under 250 KB", () => {
    for (const station of buildStations(chapters)) {
      const file = publicFile(stillUrl(station.id));
      expect(existsSync(file), station.id).toBe(true);
      expect(statSync(file).size, station.id).toBeLessThanOrEqual(MAX_STILL_BYTES);
    }
  });

  it("has a model within the 2.5 MB budget that is a binary glTF", () => {
    const file = publicFile(MODEL_URL);
    expect(statSync(file).size).toBeLessThanOrEqual(MAX_MODEL_BYTES);
    expect(readFileSync(file).subarray(0, 4).toString("ascii")).toBe("glTF");
  });
});
