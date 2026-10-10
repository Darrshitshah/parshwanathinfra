/**
 * Company, contact and legal facts. Owner: data-lead (seeded by the Director from docs/SOURCE_PACK.md section 1).
 * Unknown values are "TBD" and listed in docs/QUESTIONS.md.
 */
import { siteSchema, TBD, type Site } from "./schema";

export const site: Site = siteSchema.parse({
  name: "Parshwanath Infra",
  // Confirmed by Darshit 2026-10-10.
  legalName: "Parshwanath Infra Pvt. Ltd.",
  url: TBD,
  tagline: "Planned neighbourhoods, drawn to life.",
  contact: {
    // Confirmed by Darshit 2026-10-10: both are sales numbers, 78743 05000 is WhatsApp.
    phones: [
      { label: "Sales", number: "7874305000", whatsapp: true },
      { label: "Sales", number: "7874306000", whatsapp: false },
    ],
    whatsapp: "7874305000",
    email: TBD,
    officeHours: TBD,
    office: {
      name: "Parshwanath Infra site office, Shiv Shiva Township",
      address: "Opp. Haryana Hotel, Pipariya, Karamkhal, Vapi-Silvassa Road",
      geo: { lat: 20.2934524, lng: 72.9932563 },
      mapUrl: "https://maps.app.goo.gl/DeFCbMwyrYEGZ5Gi9",
    },
  },
  // Darshit 2026-10-10: do not mention RERA on the site yet (Gujarat RERA registration to follow).
  rera: { number: TBD, authority: TBD, url: TBD },
  social: [],
  disclaimers: {
    artistImpression: "Images of buildings are artist's impressions and are indicative only.",
    general:
      "Plans, areas, counts and specifications shown are indicative and subject to change and approvals. This website is for information only and is not an offer or a contract.",
    rera: "RERA registration details will be published here once available.",
  },
});
