/**
 * Project pages copy (the Projects index and the project detail page). Owner: pages-lead. Page copy that is not a
 * fact: facts (counts, address, status, years) are read from src/content/projects and composed in the components.
 * "TBD" renders as a chip, *starred* words as emphasis, ~tilded~ words never wrap. No em or en dashes.
 */

export const projectsIndexCopy = {
  eyebrow: "Projects",
  title: "Projects",
  intro: "The developer's work, one township at a time.",
  flagship: "Flagship",
  open: "View the project",
  facts: { status: "Status", started: "Started", offering: "Offering" },
  metaTitle: "Projects",
  metaDescription: "Shiv Shiva Township, the flagship project of Parshwanath Infra, on the Vapi-Silvassa Road.",
} as const;

export const projectCopy = {
  eyebrow: "Sheet 02 · Project",
  breadcrumbLabel: "Breadcrumb",
  breadcrumbProjects: "Projects",
  subnavLabel: "On this page",
  subnav: [
    { id: "overview", label: "Overview" },
    { id: "plan", label: "Plan" },
    { id: "homes", label: "Homes" },
    { id: "row-houses", label: "Row houses" },
    { id: "amenities", label: "Amenities" },
    { id: "location", label: "Location" },
    { id: "gallery", label: "Gallery" },
    { id: "brochure", label: "Brochure" },
    { id: "enquire", label: "Enquire" },
  ],
  hero: {
    posterCaption: "Main road corner at sunset",
    facts: { developer: "Developer", status: "Status", started: "Started" },
  },
  overview: {
    eyebrow: "Overview",
    heading: "At a *glance*.",
    countsLabel: "Unit counts",
    indicativeNote: "Counts and plans are indicative and subject to approvals.",
    offeringLabel: "What is offered",
    factsLabel: "Project facts",
    labels: {
      address: "Address",
      status: "Status",
      started: "Development began",
      possession: "Possession",
      landArea: "Land area",
      approvals: "Approvals",
      price: "Price",
      developer: "Developer",
    },
  },
  homes: {
    eyebrow: "Homes",
    heading: "Flats, row houses and shops.",
    body: "Three kinds of home and shop share one plan: 1 BHK and 2 BHK flats, 2 BHK and 3 BHK row houses, and shops. Areas, floor plans and availability: TBD.",
    units: {
      title: "Unit types",
      count: "Count",
      offering: "Offering",
      area: "Carpet or built-up area",
      plan: "Floor plan",
      note: "Floor plans are drawn from the layout plan once the unit types and the area basis are confirmed.",
    },
    explorer: {
      title: "Building explorer",
      floors: "Floors per building",
      legendTitle: "Availability",
      legend: [
        { id: "available", label: "Available" },
        { id: "booked", label: "Booked" },
        { id: "sold", label: "Sold" },
        { id: "tbd", label: "TBD" },
      ],
      note: "Floors per building: TBD. Availability on request.",
      caption: "Residential blocks around a parking court",
    },
  },
  brochure: {
    eyebrow: "Brochure and registration",
    heading: "Brochure, price and *registration*.",
    brochureTitle: "Brochure",
    brochureNote: "The brochure download will sit behind the enquiry form once a brochure exists.",
    brochureButton: "Brochure",
    priceTitle: "Price",
    priceNote: "Starting price and current offers: confirm with the site office.",
    reraTitle: "RERA and approvals",
    disclaimersTitle: "Disclaimers",
  },
  metaFallbackTitle: "Project",
} as const;
