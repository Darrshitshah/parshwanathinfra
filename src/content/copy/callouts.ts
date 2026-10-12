/**
 * Mono callouts drawn over the static images. Owner: pages-lead.
 *
 * Positions are percentages of the image (x to the right, y down). Where a point exists in the plan content (the main
 * entry, the roundabout) it is derived from src/content/plan, never typed here. The other plan points come from
 * docs/SOURCE_PACK.md section 5 (render grid 2000 x 1342) and are indicative. Row-house features come from the
 * SS-26 image notes. Callouts are decorative on the image (aria-hidden); the legend list beside each figure is the
 * text equivalent. No em or en dashes.
 */
import { plan } from "@/content/plan";

export type CalloutDirection = "up" | "down" | "left" | "right";

export interface CalloutSpec {
  id: string;
  /** Short mono label shown on the image at large widths. */
  label: string;
  /** Full sentence for the legend, read by screen readers. */
  detail: string;
  /** Percent of the image width. */
  x: number;
  /** Percent of the image height. */
  y: number;
  dir: CalloutDirection;
  /** Leader length as a CSS length. */
  len: string;
  /** For up and down leaders: put the label to the left of the leader instead of the right. */
  align?: "start" | "end";
}

type GridPoint = readonly [number, number];

function gridToPercent([px, py]: GridPoint): { x: number; y: number } {
  return { x: (px / plan.grid.width) * 100, y: (py / plan.grid.height) * 100 };
}

/* Render-grid points from docs/SOURCE_PACK.md section 5: shops block A near (1730 to 1880, 688 to 776), office
 * rectangle x 1643, y 688, w 50, h 34. The row-house district centre is read off the top-down render. */
const SHOPS_BLOCK_A: GridPoint = [1805, 732];
const SITE_OFFICE: GridPoint = [1668, 705];
const ROW_HOUSE_DISTRICT: GridPoint = [544, 650];

const mainEntry = plan.entries.find((entry) => entry.kind === "main");
const MAIN_ENTRY: GridPoint = mainEntry?.point ?? [1892, 652];

/** Callouts over the top-down layout render (home "plan" section and the project page plan). */
export const planCallouts: readonly CalloutSpec[] = [
  {
    id: "main-entry",
    label: "Main entry",
    detail: "The main entry from the Vapi-Silvassa Road, with a security cabin.",
    ...gridToPercent(MAIN_ENTRY),
    dir: "up",
    len: "4.5rem",
    align: "end",
  },
  {
    id: "roundabout",
    label: "Roundabout",
    detail: "The 40 ft boulevard from the entry reaches a roundabout with a sculpture.",
    ...gridToPercent(plan.roundabout.center),
    dir: "up",
    len: "4rem",
  },
  {
    id: "site-office",
    label: "Site office",
    detail: "The Parshwanath Infra site office, beside shops block A at the entry.",
    ...gridToPercent(SITE_OFFICE),
    dir: "left",
    len: "4rem",
  },
  {
    id: "shops-block-a",
    label: "Shops block A",
    detail: "A triangular block of shops at the gate: ground + 5, with a roof terrace above.",
    ...gridToPercent(SHOPS_BLOCK_A),
    dir: "down",
    len: "4.5rem",
    align: "end",
  },
  {
    id: "row-house-district",
    label: "Row-house district",
    detail: "Row houses in terrace strips beyond the flats. Indicative, as per the current layout plan.",
    ...gridToPercent(ROW_HOUSE_DISTRICT),
    dir: "up",
    len: "5rem",
  },
];

/**
 * One callout on the hero aerial: the frontage road runs the full height of the image's right edge, so the pin
 * sits on it however the frame is cropped (the crop only trims the top and bottom).
 */
export const heroCallouts: readonly CalloutSpec[] = [
  {
    id: "frontage-road",
    label: "Vapi-Silvassa Road",
    detail: "The Vapi-Silvassa Road along the edge of the site.",
    x: 95.2,
    y: 50,
    dir: "left",
    len: "4.5rem",
  },
];

/** Callouts over the row-house elevation (SS-26 by day). Order follows the legend. */
export const rowHouseCallouts: readonly CalloutSpec[] = [
  {
    id: "portal-frame",
    label: "White portal frame",
    detail: "A deep white portal frame around one home.",
    x: 8.6,
    y: 56.6,
    dir: "up",
    len: "7.5rem",
  },
  {
    id: "balcony-bay",
    label: "Recessed balcony bay",
    detail: "A recessed open balcony bay on the next home, alternating with the portal frame.",
    x: 37,
    y: 47.5,
    dir: "up",
    len: "4.75rem",
  },
  {
    id: "brick-pillar",
    label: "Red exposed-brick pillar",
    detail: "A red exposed-brick pillar on each pair of homes.",
    x: 17.3,
    y: 50.5,
    dir: "up",
    len: "2.5rem",
  },
  {
    id: "planters",
    label: "Planters with creepers",
    detail: "Planter boxes with creepers under the upper windows.",
    x: 44.3,
    y: 57.8,
    dir: "down",
    len: "6.5rem",
  },
  {
    id: "car-porch",
    label: "Car porch",
    detail: "A car porch on the ground floor of each home.",
    x: 35,
    y: 66,
    dir: "down",
    len: "3rem",
  },
  {
    id: "two-storeys",
    label: "Two storeys",
    detail: "Two storeys: a ground floor and one upper floor, with a roof terrace above.",
    x: 69.5,
    y: 59.5,
    dir: "down",
    len: "3.5rem",
  },
  {
    id: "flat-roof",
    label: "Flat roof",
    detail: "A flat roof with a plain parapet, used as a roof terrace.",
    x: 70.5,
    y: 32.2,
    dir: "up",
    len: "3.25rem",
  },
];
