import { describe, expect, it } from "vitest";
import {
  copy,
  countsSchema,
  hasForbiddenDash,
  isTbd,
  mediaLibrarySchema,
  orTbd,
  phoneSchema,
  planSchema,
  TBD,
  transformSchema,
} from "./schema";
import { z } from "zod";

const square: [number, number][] = [
  [0, 0],
  [10, 0],
  [10, 10],
];

function minimalPlan(overrides: Record<string, unknown> = {}) {
  return {
    version: "test",
    notes: [],
    grid: { width: 2000, height: 1342, viewBox: [0, 150, 2000, 1100] },
    metresPerPx: 0.5,
    northDeg: 180,
    boundary: square,
    roads: [],
    roundabout: { center: [1320, 651], radius: 30 },
    entries: [],
    gardens: [],
    districts: [],
    buildings: [],
    plots: [],
    amenities: [],
    ...overrides,
  };
}

describe("copy", () => {
  it("accepts plain text and the middle dot separator", () => {
    expect(copy.parse("Flats · Row houses · Shops")).toBe("Flats · Row houses · Shops");
  });

  it("rejects em and en dashes", () => {
    expect(copy.safeParse(`Vapi ${String.fromCharCode(0x2014)} Silvassa`).success).toBe(false);
    expect(copy.safeParse(`2024 ${String.fromCharCode(0x2013)} 2026`).success).toBe(false);
    expect(hasForbiddenDash("a-b")).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(copy.safeParse("   ").success).toBe(false);
  });
});

describe("orTbd", () => {
  const schema = orTbd(z.number());

  it("accepts a value or the TBD literal", () => {
    expect(schema.parse(3)).toBe(3);
    expect(schema.parse(TBD)).toBe(TBD);
    expect(isTbd(TBD)).toBe(true);
    expect(isTbd(3)).toBe(false);
  });

  it("rejects other placeholders", () => {
    expect(schema.safeParse("unknown").success).toBe(false);
    expect(schema.safeParse("tbd").success).toBe(false);
  });
});

describe("countsSchema", () => {
  it("accepts the confirmed Shiv Shiva counts", () => {
    expect(countsSchema.parse({ flats: 1250, rowHouses: 165, shops: 150, total: 1565 }).total).toBe(1565);
  });

  it("rejects counts that do not sum to the total", () => {
    expect(countsSchema.safeParse({ flats: 1250, rowHouses: 165, shops: 150, total: 1600 }).success).toBe(false);
  });
});

describe("phoneSchema", () => {
  it("accepts a normalised Indian mobile or TBD", () => {
    expect(phoneSchema.safeParse({ label: "Sales", number: "7874305000", whatsapp: TBD }).success).toBe(true);
    expect(phoneSchema.safeParse({ label: "Sales", number: TBD, whatsapp: TBD }).success).toBe(true);
  });

  it("rejects numbers with prefixes or spaces", () => {
    expect(phoneSchema.safeParse({ label: "Sales", number: "+91 78743 05000", whatsapp: false }).success).toBe(false);
    expect(phoneSchema.safeParse({ label: "Sales", number: "5874305000", whatsapp: false }).success).toBe(false);
  });
});

describe("mediaLibrarySchema", () => {
  const base = {
    id: "ss-02-topdown",
    kind: "render",
    src: "/media/ss-02-topdown.webp",
    width: 2560,
    height: 1718,
    blurDataURL: "data:image/webp;base64,AAAA",
    alt: "Top-down view of Shiv Shiva Township",
    artistImpression: true,
    source: "SS-02 Masterplan Top-Down.jpeg",
  };

  it("accepts a render flagged as an artist's impression", () => {
    expect(mediaLibrarySchema.safeParse([base]).success).toBe(true);
  });

  it("rejects renders without the artist's impression flag and duplicate ids", () => {
    expect(mediaLibrarySchema.safeParse([{ ...base, artistImpression: false }]).success).toBe(false);
    expect(mediaLibrarySchema.safeParse([base, base]).success).toBe(false);
  });
});

describe("planSchema", () => {
  it("accepts a minimal plan", () => {
    expect(planSchema.safeParse(minimalPlan()).success).toBe(true);
  });

  it("rejects duplicate plot numbers and plots outside 1 to 165", () => {
    const plot = { number: 7, strip: "n1", polygon: square, type: "TBD", status: "TBD", indicative: true };
    expect(planSchema.safeParse(minimalPlan({ plots: [plot, plot] })).success).toBe(false);
    expect(planSchema.safeParse(minimalPlan({ plots: [{ ...plot, number: 166 }] })).success).toBe(false);
  });

  it("rejects duplicate building ids", () => {
    const building = {
      id: "b1",
      sheetTag: "B1",
      sector: "01",
      typology: "flats",
      floors: TBD,
      polygon: square,
      indicative: true,
    };
    expect(planSchema.safeParse(minimalPlan({ buildings: [building, building] })).success).toBe(false);
  });
});

describe("transformSchema", () => {
  it("requires at least six control points", () => {
    const point = { name: "p", cad: [0, 0], render: [0, 0], residualPx: 1 };
    const transform = {
      from: "cad-display-pt",
      to: "render-px",
      matrix: [-1, 0, 0, -1, 2000, 1342],
      controlPoints: Array.from({ length: 5 }, () => point),
      rmsPx: 1,
      maxPx: 2,
      metresPerCadPt: 0.3,
      metresPerRenderPx: 0.5,
      method: "affine",
    };
    expect(transformSchema.safeParse(transform).success).toBe(false);
    expect(transformSchema.safeParse({ ...transform, controlPoints: [...transform.controlPoints, point] }).success).toBe(true);
  });
});
