/** UI strings of the diorama (English). Owner: scene-lead. Facts stay in plan.json and chapters.ts. */
export const dioramaStrings = {
  impression: "Artist's impression",
  stageLabel: "Three dimensional model of Shiv Shiva Township in white clay, with the confirmed building heights",
  sequenceLabel: "Scroll through the township, from the overview to the tip of the row-house district",
  chapterList: "Chapters of the model",
  loading: "Loading the model",
  openInPlan: "Open in the plan",
  stationCount: (index: number, total: number) => `${String(index).padStart(2, "0")} of ${String(total).padStart(2, "0")}`,
} as const;
