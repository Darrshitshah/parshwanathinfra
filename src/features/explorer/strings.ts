/** Interface strings for the building explorer. Facts come from content; no dashes. */

/** 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th", 11 -> "11th". */
export function ordinal(n: number): string {
  const tail = n % 100;
  if (tail >= 11 && tail <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

export const explorerStrings = {
  title: (label: string) => label,
  floorsTbd: "Floors: TBD",
  elevationLabel: "Schematic elevation, one band per floor. Not to scale.",
  floorsIndicative: (n: number) => `${n} shown, indicative`,
  levelLabel: (n: number) => `Level ${n}`,
  groundLabel: "Ground",
  floorLabel: (n: number) => `${ordinal(n)} floor`,
  terraceLabel: "Terrace",
  floorsConfirmed: (upper: number) => `Floors: Ground + ${upper}`,
  terraceNote: "roof terrace above",
  indicativeNote: "Levels counted from the renders. The number of floors is to be confirmed.",
  legendHeading: "Availability",
  legendTbd: "Availability on request",
  statusNames: { available: "Available", booked: "Booked", sold: "Sold", TBD: "To be confirmed" },
  unitsLabel: "Units on this floor:",
  samplesHeading: "Plans we can show",
  samplesNote: "Sample plans from the 2022 layout plan, not yet matched to a floor or a number of homes.",
  unit: (id: string) => `Home ${id}`,
  drawPlan: "Draw this plan",
  planHeading: "Floor plan",
  rooms: "Rooms",
  sizesNote: "Sizes as drawn on the layout plan, in feet and inches.",
  area: "Area",
  type: "Type",
  enquire: "Enquire about this home",
  close: "Close",
  replay: "Draw again",
  pickFloor: "Choose a floor to see its homes.",
  pickPlan: "Choose a plan to draw it room by room.",
} as const;
