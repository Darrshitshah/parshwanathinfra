/**
 * Shiv Shiva Township. Owner: data-lead (seeded by the Director from docs/SOURCE_PACK.md section 1).
 */
import { projectSchema, TBD, type Project } from "../schema";

export const shivShiva: Project = projectSchema.parse({
  slug: "shiv-shiva",
  name: "Shiv Shiva Township",
  developer: "Parshwanath Infra",
  status: "In development",
  started: 2024,
  possession: TBD,
  summary:
    "An integrated, mixed-use township on the Vapi-Silvassa Road: flats, row houses and shops in one planned neighbourhood.",
  location: {
    address: "Opp. Haryana Hotel, Pipariya, Karamkhal, Vapi-Silvassa Road",
    village: "Karamkhal",
    road: "Vapi-Silvassa Road",
    geo: { lat: 20.2934524, lng: 72.9932563 },
    mapUrl: "https://maps.app.goo.gl/DeFCbMwyrYEGZ5Gi9",
    landmarks: TBD,
  },
  counts: { flats: 1250, rowHouses: 165, shops: 150, total: 1565 },
  offering: [
    { typology: "flats", label: "1 BHK and 2 BHK flats" },
    { typology: "rowhouses", label: "2 BHK and 3 BHK row houses" },
    { typology: "shops", label: "Shops" },
  ],
  // Past ads said "Price starts ₹17.05 L onwards" for 1 and 2 BHK flats; unconfirmed for today.
  price: { display: "Price on request", confirmed: false },
  rera: { number: TBD, authority: TBD },
  approvals: TBD,
  landArea: TBD,
  amenities: [
    { id: "roundabout-sculpture", name: "Entry roundabout and sculpture", mediaId: "roundabout", evidence: "plan-and-render", planId: "roundabout-sculpture" },
    { id: "clubhouse-lawn", name: "Clubhouse lawn and gazebos", mediaId: "clubhouse-lawn", evidence: "render" },
    { id: "central-garden-island", name: "Central garden island", mediaId: "garden-island", evidence: "render" },
    { id: "temple-courtyard", name: "Temple courtyard", mediaId: "temple-court", evidence: "render" },
    { id: "childrens-play-area", name: "Children's play area", mediaId: "play-area", evidence: "render" },
    { id: "courtyard-playground", name: "Courtyard playgrounds", mediaId: "courtyard-playground", evidence: "plan-and-render", planId: "playground-sector-05" },
    { id: "central-lawn", name: "Central lawn axis", mediaId: "central-lawn", evidence: "render" },
    { id: "garden-courts", name: "Garden courts", mediaId: "garden-court", evidence: "plan-and-render", planId: "garden-courts" },
    { id: "linear-garden", name: "Linear garden with a water feature", mediaId: "linear-garden", evidence: "plan", planId: "linear-garden" },
    { id: "shop-street", name: "Shops inside the township", mediaId: "shop-street-night", evidence: "plan-and-render" },
  ],
  galleryIds: [
    "masterplan-full",
    "shop-street-night",
    "main-road",
    "roundabout",
    "clubhouse-lawn",
    "towers-courtyard",
    "garden-island",
    "temple-court",
    "row-houses-dusk",
    "garden-court",
    "play-area",
    "clubhouse-court",
    "central-lawn",
    "courtyard-playground",
    "clubhouse",
    "row-house-wing",
    "row-house-street",
    "row-houses-day",
    "landscape",
  ],
  heroMediaId: "masterplan-aerial",
  brochure: TBD,
  seo: {
    title: "Shiv Shiva Township · Flats, row houses and shops on the Vapi-Silvassa Road",
    description:
      "Explore Shiv Shiva Township by Parshwanath Infra: 1,250 flats, 165 row houses and 150 shops in one planned township on the Vapi-Silvassa Road.",
    ogMediaId: "masterplan-aerial",
  },
});
