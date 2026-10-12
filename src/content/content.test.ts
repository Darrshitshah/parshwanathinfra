import { describe, expect, it } from "vitest";
import { inventory } from "./inventory";
import { getMedia, media } from "./media";
import { getProject, shivShiva, visibleProjects } from "./projects";
import { site } from "./site";
import { isTbd } from "./schema";

describe("Shiv Shiva content", () => {
  it("uses the confirmed unit counts", () => {
    const { flats, rowHouses, shops, total } = shivShiva.counts;
    expect([flats, rowHouses, shops, total]).toEqual([1250, 165, 150, 1565]);
  });

  it("references only media that exists", () => {
    const referenced = [
      shivShiva.heroMediaId,
      shivShiva.seo.ogMediaId,
      ...shivShiva.galleryIds,
      ...shivShiva.amenities.flatMap((amenity) => (amenity.mediaId ? [amenity.mediaId] : [])),
    ].filter((id): id is string => Boolean(id));
    for (const id of referenced) expect(() => getMedia(id)).not.toThrow();
  });

  it("keeps unconfirmed facts as TBD", () => {
    expect(isTbd(shivShiva.rera.number)).toBe(true);
    expect(isTbd(site.rera.number)).toBe(true);
    expect(shivShiva.price.confirmed).toBe(false);
  });

  it("lists Shiv Shiva as the only visible project", () => {
    expect(visibleProjects().map((project) => project.slug)).toEqual(["shiv-shiva"]);
    expect(getProject("unknown")).toBeUndefined();
  });
});

describe("media library", () => {
  it("gives every image alt text and flags every render", () => {
    for (const item of media) {
      expect(item.alt.length).toBeGreaterThan(8);
      if (item.kind === "render") expect(item.artistImpression).toBe(true);
    }
  });

  it("throws on unknown ids", () => {
    expect(() => getMedia("nope")).toThrow(/Unknown media id/);
  });
});

describe("inventory", () => {
  it("has 165 plots, all TBD until Darshit supplies availability", () => {
    expect(inventory.plots).toHaveLength(165);
    expect(inventory.plots.every((plot) => plot.status === "TBD")).toBe(true);
  });

  it("gives every explorable block the confirmed 6 levels and leaves units TBD", () => {
    expect(inventory.buildings.length).toBeGreaterThan(0);
    for (const record of inventory.buildings) {
      expect(record.floors, record.buildingId).toBe(6);
      expect(record.units, record.buildingId).toBe("TBD");
    }
  });
});
