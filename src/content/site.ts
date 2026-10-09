/**
 * Company, contact and legal facts. Owner: data-lead (seeded by the Director from docs/SOURCE_PACK.md section 1).
 * Unknown values are "TBD" and listed in docs/QUESTIONS.md.
 */
import { siteSchema, TBD, type Site } from "./schema";

export const site: Site = siteSchema.parse({
  name: "Parshwanath Infra",
  // Portfolio says "Parshwanath Infra Pvt. Ltd."; to be confirmed against "Parshwanath Infrastructure Pvt. Ltd.".
  legalName: TBD,
  url: TBD,
  tagline: "Planned neighbourhoods, drawn to life.",
  contact: {
    // Past ads show 78743 05000 and 78743 06000; unconfirmed, so hidden until Darshit confirms.
    phones: [{ label: "Sales", number: TBD, whatsapp: TBD }],
    whatsapp: TBD,
    email: TBD,
    officeHours: TBD,
    office: {
      name: "Parshwanath Infra site office, Shiv Shiva Township",
      address: "Opp. Haryana Hotel, Pipariya, Karamkhal, Vapi-Silvassa Road",
      geo: { lat: 20.2934524, lng: 72.9932563 },
      mapUrl: "https://maps.app.goo.gl/DeFCbMwyrYEGZ5Gi9",
    },
  },
  rera: { number: TBD, authority: TBD, url: TBD },
  social: [],
  disclaimers: {
    artistImpression: "Images of buildings are artist's impressions and are indicative only.",
    general:
      "Plans, areas, counts and specifications shown are indicative and subject to change and approvals. This website is for information only and is not an offer or a contract.",
    rera: "RERA registration details will be published here once available.",
  },
});
