/**
 * The six scroll chapters shared by the Living Plan (S3) and the diorama (S4). Owner: data-lead.
 *
 * `view` is the camera on the render grid (2000 x 1342), [x, y, w, h], and always has the default stage ratio 20:11
 * (the viewBox of the web plan SVG is 0 150 2000 1100); on any other stage ratio, fit the box with "meet".
 * Hotspot points are not typed in by hand: each hotspot names a plan element by its SVG id (`ref`, see refs.ts) and its
 * point is resolved from plan.json, so a replaced plan moves the hotspots with it. Copy is short and factual: widths
 * are the ones written on the layout plan, nothing here is a marketing claim.
 */
import { chapterSchema, type Chapter } from "../schema";
import { refPoint } from "./refs";

interface HotspotSpec {
  id: string;
  label: string;
  /** SVG id of the plan element (b-, plot-, road-, g-, a-, e-, district-). */
  ref: string;
  /** Position along a road's centre line, 0 to 1 (roads only). */
  along?: number;
  labelTbd?: boolean;
}

interface ChapterSpec {
  id: string;
  title: string;
  body: string;
  view: [number, number, number, number];
  hotspots: HotspotSpec[];
}

const specs: ChapterSpec[] = [
  {
    id: "entry",
    title: "Entry",
    body: "The main entry opens onto the Vapi-Silvassa Road. A security cabin stands beside it, with shops block A and the Parshwanath Infra site office just inside.",
    view: [1520, 520, 480, 264],
    hotspots: [
      { id: "entry-main", label: "Main entry", ref: "e-main-entry" },
      { id: "entry-cabin", label: "Security cabin", ref: "a-main-entry-cabin" },
      { id: "entry-shops-a", label: "Shops block A", ref: "b-shops-a" },
      { id: "entry-office", label: "Parshwanath Infra site office", ref: "b-office" },
    ],
  },
  {
    id: "boulevard",
    title: "Boulevard",
    body: "Four internal roads meet at the roundabout: the 40 ft boulevard from the entry, a 40 ft diagonal road, the 30 ft spine and a 20 ft road. Renders show a planted island with a sculpture at the centre.",
    view: [1180, 500, 720, 396],
    hotspots: [
      { id: "boulevard-road", label: "40 ft boulevard", ref: "road-boulevard-40ft", along: 0.55 },
      { id: "boulevard-roundabout", label: "Roundabout", ref: "a-roundabout-sculpture" },
      { id: "boulevard-diagonal", label: "40 ft diagonal road", ref: "road-diagonal-40ft", along: 0.14 },
      { id: "boulevard-lane", label: "20 ft road", ref: "road-north-road-20ft", along: 0.45 },
    ],
  },
  {
    id: "flats",
    title: "Flats",
    body: "Flat blocks stand in five sectors around garden courts, with playgrounds in the courts. The mixed-use building B1/B2 by the entry holds commercial space and homes.",
    view: [536, 283, 1464, 805],
    hotspots: [
      { id: "flats-mixed", label: "Mixed-use building B1/B2", ref: "b-b1-b2" },
      { id: "flats-garden-01", label: "Garden court, sector 01", ref: "g-garden-court-sector-01" },
      { id: "flats-playground-05", label: "Playground, sector 05", ref: "a-playground-sector-05" },
      { id: "flats-linear-garden", label: "Linear garden", ref: "a-linear-garden" },
    ],
  },
  {
    id: "spine-and-gate",
    title: "Spine and gate",
    body: "The 30 ft spine road runs from the roundabout towards the row houses. An entry is marked where it passes from the flats into the row-house district.",
    view: [400, 430, 760, 418],
    hotspots: [
      { id: "spine-road", label: "Spine road, 30 ft", ref: "road-spine-30ft", along: 0.62 },
      { id: "spine-entry", label: "Row-house entry", ref: "e-rowhouse-entry" },
      { id: "spine-plots-1-11", label: "Plots 1 to 11", ref: "b-rh-strip-15" },
      { id: "spine-plots-155-165", label: "Plots 155 to 165", ref: "b-rh-strip-08" },
    ],
  },
  {
    id: "row-houses",
    title: "Row houses",
    body: "165 row houses stand in strips along 20 ft lanes, with a linear garden and a water feature near the far end. Positions and plot numbers are indicative, as per the current layout plan.",
    view: [0, 372, 1200, 660],
    hotspots: [
      { id: "rowhouses-lanes", label: "20 ft lanes", ref: "road-lane-20ft-north-2", along: 0.5 },
      { id: "rowhouses-garden", label: "Linear garden and water feature", ref: "g-garden-linear-rowhouses" },
      { id: "rowhouses-tilted", label: "Tilted strips, plots 53 to 108", ref: "b-rh-tip-02" },
      { id: "rowhouses-plots-109-112", label: "Plots 109 to 112", ref: "b-rh-strip-01" },
    ],
  },
  {
    id: "the-tip",
    title: "The tip",
    body: "At the far end of the district: an open lawn, a building on a paved plaza and a play area. Whether the building is a clubhouse or a temple is not confirmed.",
    view: [20, 470, 440, 242],
    hotspots: [
      { id: "tip-building", label: "Building on a paved plaza", ref: "a-tip-building", labelTbd: true },
      { id: "tip-play-area", label: "Play area", ref: "a-tip-play-area" },
      { id: "tip-lawn", label: "Open lawn", ref: "g-lawn-tip" },
    ],
  },
];

function resolvePoint(spec: HotspotSpec): [number, number] {
  const point = refPoint(spec.ref, spec.along);
  if (!point) throw new Error(`Chapter hotspot ${spec.id}: unknown plan reference ${spec.ref}`);
  return point;
}

export const chapters: Chapter[] = specs.map((spec, index) =>
  chapterSchema.parse({
    id: spec.id,
    index: index + 1,
    title: spec.title,
    body: spec.body,
    view: spec.view,
    hotspots: spec.hotspots.map((hotspot) => ({
      id: hotspot.id,
      label: hotspot.label,
      point: resolvePoint(hotspot),
      ref: hotspot.ref,
      labelTbd: hotspot.labelTbd ?? false,
    })),
  }),
);

export function chapterById(id: string): Chapter | undefined {
  return chapters.find((chapter) => chapter.id === id);
}
