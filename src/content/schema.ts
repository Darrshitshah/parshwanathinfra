/**
 * Content contracts for the whole site. Every fact the site shows lives in src/content/** and is
 * validated against these schemas at build time (the content modules call `.parse`).
 *
 * Owner: Director. Leads build against these types; ask the Director for changes.
 *
 * Rules encoded here:
 * - A value nobody has confirmed is the literal "TBD" (see `orTbd`), and the UI shows a visible TBD chip.
 * - Copy never contains an em dash (U+2014) or en dash (U+2013): `copy` rejects them.
 * - Plan geometry is in render-grid pixels (2000 x 1342, `masterplan-topdown-upload.webp`), y pointing down.
 */
import { z } from "zod";

/* ------------------------------------------------------------------------------------------------ */
/* Primitives                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

export const TBD = "TBD" as const;
export type Tbd = typeof TBD;
export type MaybeTbd<T> = T | Tbd;

export const tbdSchema = z.literal(TBD);

/** Accept a confirmed value or the literal "TBD". */
export function orTbd<T extends z.ZodType>(schema: T) {
  return z.union([schema, tbdSchema]);
}

export function isTbd(value: unknown): value is Tbd {
  return value === TBD;
}

const EN_DASH = String.fromCharCode(0x2013);
const EM_DASH = String.fromCharCode(0x2014);
const DASH_PATTERN = new RegExp(`[${EN_DASH}${EM_DASH}]`);

export function hasForbiddenDash(text: string): boolean {
  return DASH_PATTERN.test(text);
}

/** Any human-readable text: non-empty, trimmed, no em or en dashes. */
export const copy = z
  .string()
  .trim()
  .min(1)
  .refine((s) => !hasForbiddenDash(s), { message: "No em dashes (U+2014) or en dashes (U+2013) in copy" });

export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase-kebab-case");

/** A path served from /public, e.g. "/media/ss-02-topdown-1920.webp". */
export const publicPath = z.string().regex(/^\/[^\s]*$/, "absolute public path without spaces");

export const geoSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/** A point on the render grid, [x, y] in pixels. */
export const pointSchema = z.tuple([z.number(), z.number()]);
export const polygonSchema = z.array(pointSchema).min(3);
export const polylineSchema = z.array(pointSchema).min(2);

export type Point = z.infer<typeof pointSchema>;
export type Polygon = z.infer<typeof polygonSchema>;

/* ------------------------------------------------------------------------------------------------ */
/* Site                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

/** Indian mobile number after normalisation: 10 digits starting 6 to 9. */
export const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export const phoneSchema = z.object({
  label: copy,
  /** 10-digit Indian mobile, no prefix, no spaces. */
  number: orTbd(z.string().regex(INDIAN_MOBILE)),
  whatsapp: orTbd(z.boolean()),
});

export const siteSchema = z.object({
  name: copy,
  legalName: orTbd(copy),
  /** Production origin, e.g. "https://parshwanathinfra.com". TBD until the domain exists. */
  url: orTbd(z.url()),
  tagline: copy,
  contact: z.object({
    phones: z.array(phoneSchema),
    /** WhatsApp number as 10 digits; the floating button stays hidden while TBD. */
    whatsapp: orTbd(z.string().regex(INDIAN_MOBILE)),
    email: orTbd(z.email()),
    officeHours: orTbd(copy),
    office: z.object({
      name: copy,
      address: copy,
      geo: geoSchema,
      mapUrl: z.url(),
    }),
  }),
  rera: z.object({
    number: orTbd(copy),
    authority: orTbd(copy),
    url: orTbd(z.url()),
  }),
  social: z.array(z.object({ label: copy, url: z.url() })),
  disclaimers: z.object({
    artistImpression: copy,
    general: copy,
    rera: copy,
  }),
});

export type Site = z.infer<typeof siteSchema>;

/* ------------------------------------------------------------------------------------------------ */
/* Media                                                                                             */
/* ------------------------------------------------------------------------------------------------ */

export const mediaKind = z.enum(["render", "clay-render", "photo", "plan", "generated", "logo", "diagram", "icon"]);

export const mediaSchema = z.object({
  id: slug,
  kind: mediaKind,
  /** Master file in /public (largest web width). next/image derives smaller widths and AVIF/WebP. */
  src: publicPath,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Tiny base64 placeholder (data:image/...;base64,...). */
  blurDataURL: z.string().startsWith("data:image/"),
  alt: copy,
  caption: copy.optional(),
  /** Renders and AI-enhanced renders must carry the "Artist's impression" label. */
  artistImpression: z.boolean(),
  /** Original file name in Darshit's folders, for traceability (never a path into /public). */
  source: z.string().min(1),
});

export type Media = z.infer<typeof mediaSchema>;

export const mediaLibrarySchema = z.array(mediaSchema).superRefine((items, ctx) => {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) ctx.addIssue({ code: "custom", message: `Duplicate media id ${item.id}` });
    seen.add(item.id);
    const isRender = item.kind === "render" || item.kind === "clay-render" || item.kind === "generated";
    if (isRender && !item.artistImpression) {
      ctx.addIssue({ code: "custom", message: `${item.id}: renders must be flagged artistImpression` });
    }
  }
});

/* ------------------------------------------------------------------------------------------------ */
/* Plan (plan.json, transform.json)                                                                  */
/* ------------------------------------------------------------------------------------------------ */

export const typology = z.enum(["flats", "rowhouses", "shops", "mixed", "office", "amenity"]);
export type Typology = z.infer<typeof typology>;

export const unitStatus = z.enum(["available", "booked", "sold", "TBD"]);
export type UnitStatus = z.infer<typeof unitStatus>;

export const buildingSchema = z.object({
  id: slug,
  /** Tag on the 2022 CAD sheet (B1, C7, A, BLDG). */
  sheetTag: orTbd(z.string().min(1)),
  /** Tag on the newer printed sheet (S, R1, J2 ...), only when read reliably. */
  newTag: z.string().min(1).optional(),
  sector: orTbd(z.string().min(1)),
  typology,
  floors: orTbd(z.number().int().positive()),
  /** Estimate counted from the renders while `floors` is TBD; always shown as indicative. */
  floorsIndicative: z.number().int().positive().optional(),
  polygon: polygonSchema,
  label: copy.optional(),
  indicative: z.boolean(),
});

export const plotSchema = z.object({
  number: z.number().int().min(1).max(165),
  /** "low" when the number was read from the low-resolution photo of the printed sheet. */
  numberConfidence: z.enum(["high", "low"]).default("high"),
  strip: z.string().min(1),
  polygon: polygonSchema,
  type: z.enum(["2BHK", "3BHK", "TBD"]),
  status: unitStatus,
  indicative: z.boolean(),
});

export const roadSchema = z.object({
  id: slug,
  name: copy.optional(),
  /** Width as written on the sheet, e.g. "40'0\"" or "9.00 m". */
  widthLabel: orTbd(z.string().min(1)),
  widthM: orTbd(z.number().positive()),
  centerline: polylineSchema,
  polygon: polygonSchema.optional(),
  public: z.boolean().default(false),
});

export const amenitySchema = z.object({
  id: slug,
  name: copy,
  kind: z.enum(["garden", "lawn", "playground", "clubhouse", "temple", "fountain", "gazebo", "security", "parking", "sculpture", "other"]),
  point: pointSchema,
  polygon: polygonSchema.optional(),
  /** Where it is evidenced. Never list an amenity that neither the plan nor a render shows. */
  evidence: z.enum(["plan", "render", "plan-and-render"]),
  /** Label still unconfirmed (e.g. clubhouse or temple at the tip). */
  labelTbd: z.boolean().default(false),
});

export const planSchema = z
  .object({
    version: z.string().min(1),
    notes: z.array(z.string()),
    grid: z.object({
      width: z.literal(2000),
      height: z.literal(1342),
      /** Default crop of the stage, [x, y, w, h]. */
      viewBox: z.tuple([z.number(), z.number(), z.number().positive(), z.number().positive()]),
    }),
    /** Indicative scale derived from the CAD dimension lines through the transform. */
    metresPerPx: z.number().positive(),
    /** Compass bearing of grid "up" in degrees (the render is the sheet turned 180 degrees). */
    northDeg: z.number(),
    boundary: polygonSchema,
    roads: z.array(roadSchema),
    roundabout: z.object({ center: pointSchema, radius: z.number().positive() }),
    entries: z.array(
      z.object({ id: slug, point: pointSchema, kind: z.enum(["main", "court", "rowhouse", "service"]), label: copy.optional() }),
    ),
    gardens: z.array(z.object({ id: slug, polygon: polygonSchema, name: copy.optional() })),
    districts: z.array(z.object({ id: slug, name: copy, polygon: polygonSchema, indicative: z.boolean() })),
    buildings: z.array(buildingSchema),
    plots: z.array(plotSchema),
    amenities: z.array(amenitySchema),
  })
  .superRefine((plan, ctx) => {
    const ids = new Set<string>();
    for (const b of plan.buildings) {
      if (ids.has(b.id)) ctx.addIssue({ code: "custom", message: `Duplicate building id ${b.id}` });
      ids.add(b.id);
    }
    const numbers = new Set<number>();
    for (const p of plan.plots) {
      if (numbers.has(p.number)) ctx.addIssue({ code: "custom", message: `Duplicate plot ${p.number}` });
      numbers.add(p.number);
    }
  });

export type Plan = z.infer<typeof planSchema>;
export type Building = z.infer<typeof buildingSchema>;
export type Plot = z.infer<typeof plotSchema>;
export type Road = z.infer<typeof roadSchema>;
export type Amenity = z.infer<typeof amenitySchema>;

/** Affine CAD (display points) to render grid: x' = a*x + c*y + e, y' = b*x + d*y + f. */
export const transformSchema = z.object({
  from: z.literal("cad-display-pt"),
  to: z.literal("render-px"),
  matrix: z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()]),
  controlPoints: z
    .array(z.object({ name: z.string().min(1), cad: pointSchema, render: pointSchema, residualPx: z.number().nonnegative() }))
    .min(6),
  rmsPx: z.number().nonnegative(),
  maxPx: z.number().nonnegative(),
  metresPerCadPt: z.number().positive(),
  metresPerRenderPx: z.number().positive(),
  method: z.enum(["affine", "piecewise"]),
});

export type PlanTransform = z.infer<typeof transformSchema>;

/** Scroll chapters shared by the Living Plan (S3) and the diorama (S4). */
export const chapterSchema = z.object({
  id: slug,
  index: z.number().int().min(1),
  title: copy,
  body: copy,
  /** Camera on the render grid, [x, y, w, h]. */
  view: z.tuple([z.number(), z.number(), z.number().positive(), z.number().positive()]),
  hotspots: z.array(
    z.object({ id: slug, label: copy, point: pointSchema, ref: z.string().optional(), labelTbd: z.boolean().default(false) }),
  ),
});

export type Chapter = z.infer<typeof chapterSchema>;

/* ------------------------------------------------------------------------------------------------ */
/* Units and inventory                                                                               */
/* ------------------------------------------------------------------------------------------------ */

export const roomSchema = z.object({
  name: copy,
  /** Sizes as drawn, e.g. "15'4\"" x "10'0\"". */
  width: z.string().min(1),
  length: z.string().min(1),
  widthM: z.number().positive().optional(),
  lengthM: z.number().positive().optional(),
});

export const unitTypeSchema = z.object({
  id: slug,
  typology: z.enum(["flats", "rowhouses", "shops"]),
  label: copy,
  bhk: z.enum(["1BHK", "2BHK", "3BHK", "TBD"]),
  /** Area label on the sheet (473, 439 ...). Unit and area type unconfirmed. */
  sheetLabel: z.string().optional(),
  areaSqft: orTbd(z.number().positive()),
  areaType: z.enum(["carpet", "built-up", "super-built-up", "TBD"]),
  rooms: z.array(roomSchema),
  /** Floor-plan SVG in /public (or "TBD" for row houses until plans exist). */
  planSvg: orTbd(publicPath),
  indicative: z.boolean(),
});

export type UnitType = z.infer<typeof unitTypeSchema>;

export const inventorySchema = z.object({
  updated: orTbd(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  buildings: z.array(
    z.object({
      buildingId: slug,
      floors: orTbd(z.number().int().positive()),
      units: orTbd(
        z.array(z.object({ id: z.string().min(1), floor: z.number().int().min(0), unitTypeId: orTbd(slug), status: unitStatus })),
      ),
    }),
  ),
  plots: z.array(z.object({ number: z.number().int().min(1).max(165), status: unitStatus })),
});

export type Inventory = z.infer<typeof inventorySchema>;

/* ------------------------------------------------------------------------------------------------ */
/* Projects                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

export const countsSchema = z
  .object({
    flats: z.number().int().nonnegative(),
    rowHouses: z.number().int().nonnegative(),
    shops: z.number().int().nonnegative(),
    total: z.number().int().positive(),
  })
  .refine((c) => c.flats + c.rowHouses + c.shops === c.total, { message: "Unit counts must sum to the total" });

export const projectSchema = z.object({
  slug,
  name: copy,
  developer: copy,
  status: copy,
  /** Year development began, e.g. 2024. */
  started: orTbd(z.number().int().min(2000).max(2100)),
  possession: orTbd(copy),
  summary: copy,
  location: z.object({
    address: copy,
    village: copy,
    road: copy,
    geo: geoSchema,
    mapUrl: z.url(),
    landmarks: orTbd(z.array(z.object({ name: copy, distance: orTbd(copy) }))),
  }),
  counts: countsSchema,
  offering: z.array(z.object({ typology: z.enum(["flats", "rowhouses", "shops"]), label: copy })),
  price: z.object({ display: copy, confirmed: z.boolean(), note: copy.optional() }),
  rera: z.object({ number: orTbd(copy), authority: orTbd(copy) }),
  approvals: orTbd(z.array(copy)),
  landArea: orTbd(copy),
  /** Amenities shown in renders or drawn on the plan, labelled "as per plan" on the page. Never add one neither shows. */
  amenities: z.array(
    z.object({
      id: slug,
      name: copy,
      description: copy.optional(),
      mediaId: slug,
      evidence: z.enum(["plan", "render", "plan-and-render"]),
      /** Matching amenity id in plan.json once it exists. */
      planId: slug.optional(),
    }),
  ),
  galleryIds: z.array(slug),
  heroMediaId: slug,
  brochure: orTbd(publicPath),
  seo: z.object({ title: copy, description: copy, ogMediaId: slug.optional() }),
});

export type Project = z.infer<typeof projectSchema>;

export const projectIndexSchema = z.array(
  z.object({ slug, name: copy, visible: z.boolean(), flagship: z.boolean() }),
);

export type ProjectIndex = z.infer<typeof projectIndexSchema>;
