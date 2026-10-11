/**
 * SEO and social-card copy. Owner: pages-lead. English only; keep every string here (not in components) so Hindi and
 * Gujarati versions can be added beside it later. No em or en dashes. Facts (counts, road) come from the content
 * layer at the call site, never typed here.
 */
export const seoCopy = {
  /** Same string the root layout uses as its default title, so Home's social title matches its <title>. */
  homeTitle: "Parshwanath Infra · Shiv Shiva Township, Vapi-Silvassa Road",
  og: {
    /** Small caps line above the wordmark. */
    eyebrow: "Parshwanath Infra",
    artistImpression: "Artist's impression",
    homeAlt: "Shiv Shiva Township by Parshwanath Infra: an artist's impression of the township from the air",
    projectAlt: "Shiv Shiva Township drawn as a plan: the township boundary with the entry roundabout marked",
    planNote: "Boundary, from the layout plan",
    flats: "flats",
    rowHouses: "row houses",
    shops: "shops",
  },
  jsonLd: {
    organizationDescription:
      "Parshwanath Infra develops Shiv Shiva Township, an integrated township of flats, row houses and shops on the Vapi-Silvassa Road.",
  },
} as const;
