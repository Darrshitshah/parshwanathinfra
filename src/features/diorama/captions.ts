import type { Chapter } from "@/content/schema";
import { buildingHeight, OVERVIEW_ID } from "./stations";

export interface StageCaption {
  id: string;
  title: string;
  body: string;
  /** Building hotspots the model contains: keyboard users pick these from the caption. */
  buildings: ReadonlyArray<{ buildingId: string; label: string }>;
}

export const OVERVIEW_CAPTION = {
  title: "Overview",
  body: "Shiv Shiva Township as a white-clay model. Flats are blue, row houses orange, shops green and the mixed-use building purple. Scroll to move through the chapters.",
} as const;

/** Caption per station: the overview first, then each chapter (title and body come from chapters.ts). */
export function buildCaptions(chapters: ReadonlyArray<Chapter>): StageCaption[] {
  return [
    { id: OVERVIEW_ID, ...OVERVIEW_CAPTION, buildings: [] },
    ...chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      body: chapter.body,
      buildings: chapter.hotspots
        .filter((h) => h.ref?.startsWith("b-") && buildingHeight(h.ref.slice(2)) !== undefined)
        .map((h) => ({ buildingId: (h.ref as string).slice(2), label: h.label })),
    })),
  ];
}
