/**
 * SEO and social-card copy. Owner: pages-lead. English only; keep every string here (not in components) so Hindi and
 * Gujarati versions can be added beside it later. No em or en dashes. Facts (counts, road) come from the content
 * layer at the call site, never typed here.
 */
export const seoCopy = {
  /** Same string the root layout uses as its default title, so Home's social title matches its <title>. */
  homeTitle: "Parshwanath Infra · Shiv Shiva Township, Vapi-Silvassa Road",
  og: {
    artistImpression: "Artist's impression",
    /**
     * Alt text of the share card. Must equal src/app/opengraph-image.alt.txt and twitter-image.alt.txt (a test checks),
     * which Next turns into og:image:alt and twitter:image:alt on Home.
     */
    homeAlt:
      "Shiv Shiva Township by Parshwanath Infra: an artist's impression of the township from the air, with the township name over it",
    /** Strings drawn on the static share card by tools/og/build-og-card.mjs. Both come from existing page copy: the hero eyebrow and the road. */
    card: {
      titleLines: ["Shiv Shiva", "Township"],
      line: "An integrated township · Vapi-Silvassa Road",
    },
  },
  jsonLd: {
    organizationDescription:
      "Parshwanath Infra develops Shiv Shiva Township, an integrated township of flats, row houses and shops on the Vapi-Silvassa Road.",
  },
} as const;
