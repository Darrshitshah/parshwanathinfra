/**
 * About page copy. Owner: pages-lead. Only facts that are known are stated: Parshwanath Infra is the developer of
 * Shiv Shiva Township, and development began in 2024. The company story, the values and the leadership stay out
 * until Parshwanath Infra supplies them (docs/QUESTIONS.md); nothing is invented to fill the page.
 * "TBD" renders as a chip, *starred* words as emphasis, ~tilded~ words never wrap. No em or en dashes.
 */

export const aboutCopy = {
  metaTitle: "About",
  metaDescription:
    "Parshwanath Infra is the developer of Shiv Shiva Township, an integrated, mixed-use township on the Vapi-Silvassa Road.",
  eyebrow: "About",
  intro: "Parshwanath Infra is the developer of Shiv Shiva *Township*.",
  body: "Shiv Shiva is an integrated, mixed-use township on the Vapi-Silvassa Road: flats, row houses and shops in one planned neighbourhood.",
  facts: {
    eyebrow: "The company at a glance",
    developer: "Developer",
    legalName: "Legal name",
    flagship: "Flagship project",
    status: "Status",
    began: "Development began",
    office: "Site office",
  },
  timeline: {
    eyebrow: "Milestones",
    heading: "A short *timeline*.",
    /** "2024 · Shiv Shiva Township development begins" */
    milestone: (year: number, project: string): string => `${year} · ${project} development begins`,
    more: "More of the company's story, its people and further milestones will be added here once they are confirmed.",
  },
  more: {
    eyebrow: "Still to come",
    heading: "The company story, values and *leadership*.",
    text: "These are not published yet. They will appear here once Parshwanath Infra has supplied and confirmed them, rather than being written for the sake of filling the page.",
  },
  reading: {
    eyebrow: "How to read this site",
    heading: "What the labels *mean*.",
    items: [
      {
        title: "Artist's impression",
        text: "Every picture of a building is a render. It shows the intended look and carries this label on the image.",
      },
      {
        title: "TBD",
        text: "A dashed box marked TBD means the detail has not been confirmed yet. The site leaves it open rather than guess.",
      },
      {
        title: "Indicative",
        text: "Plans, counts, areas and amenities follow the current layout plan and renders and may change with approvals. The row-house district is traced from that plan and marked indicative.",
      },
    ],
  },
} as const;
