import { describe, expect, it } from "vitest";
import { chapters } from "@/content/plan/chapters";
import { buildCaptions } from "./captions";
import { dioramaStrings } from "./strings";

const captions = buildCaptions(chapters);

describe("captions", () => {
  it("has the overview and one caption per chapter, with the chapter's own words", () => {
    expect(captions).toHaveLength(chapters.length + 1);
    chapters.forEach((chapter, i) => {
      expect(captions[i + 1].title).toBe(chapter.title);
      expect(captions[i + 1].body).toBe(chapter.body);
    });
  });

  it("lists only hotspots that are buildings in the model as clickable", () => {
    const entry = captions.find((c) => c.id === "entry")!;
    expect(entry.buildings.map((b) => b.buildingId)).toEqual(["shops-a", "office"]);
    expect(captions.find((c) => c.id === "boulevard")!.buildings).toEqual([]);
  });

  it("uses no em or en dashes in any visible string", () => {
    const text = JSON.stringify([captions, dioramaStrings.impression, dioramaStrings.stageLabel]);
    expect(text).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`));
  });

  it("keeps the artist's impression label and no longer calls the heights indicative massing", () => {
    expect(dioramaStrings.impression).toBe("Artist's impression");
    // Chapter bodies may still say that positions and plot numbers are indicative; only the height wording is retired.
    expect(JSON.stringify([captions[0], dioramaStrings])).not.toMatch(/indicative/i);
    expect(JSON.stringify([captions, dioramaStrings])).not.toMatch(/indicative massing/i);
  });
});
