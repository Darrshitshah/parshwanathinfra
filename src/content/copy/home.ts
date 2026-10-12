/**
 * Home page copy. Owner: pages-lead. Page copy that is not a fact: facts (counts, address, names) are read from
 * src/content and composed in the components. Any "TBD" token in a string renders as a visible TBD chip.
 * No em or en dashes.
 */

export interface RouteStop {
  id: string;
  title: string;
  text: string;
}

export const homeCopy = {
  hero: {
    eyebrow: "Sheet 01 · Overview",
    by: "by Parshwanath Infra",
    statement: "Flats, row houses and shops, drawn together as one neighbourhood on the Vapi-Silvassa Road.",
    posterCaption: "The township from the air at golden hour",
  },
  idea: {
    eyebrow: "The idea",
    text: "Every street, garden and shopfront in Shiv Shiva begins as a line on *one plan*. Flats, row houses and shops are drawn together, as a *single neighbourhood*.",
  },
  numbers: {
    eyebrow: "The numbers",
    headline: (total: string): string => `${total} flats, row houses and shops on one plan.`,
    body: "Counts for the whole township. Each dimension line below is drawn in proportion to its share of the total.",
    unit: "units",
  },
  plan: {
    eyebrow: "The plan",
    heading: "The plan is the interface.",
    body: "One drawing holds the whole township: the Vapi-Silvassa Road and the main entry, the roundabout, the flat blocks, the shops at the gate and the row-house district beyond.",
    note: "Row-house district: indicative, as per the current layout plan.",
    figureCaption: "Layout from directly above",
    legendTitle: "Marked on the plan",
  },
  walk: {
    eyebrow: "Walk the township",
    heading: "Walk the township.",
    body: "Start on the Vapi-Silvassa Road and come in by the main gate. Follow the boulevard to the roundabout, pass the flat blocks, take the spine road to the row houses and end at the open lawn at the far tip.",
    stillCaption: "The township and its surroundings",
    routeLabel: "The route",
    stops: [
      {
        id: "entry",
        title: "Entry",
        text: "The Vapi-Silvassa Road, the main entry, the security cabin, the shops at the gate and the site office.",
      },
      {
        id: "boulevard",
        title: "Boulevard",
        text: "The 40 ft road from the entry to the roundabout and its sculpture.",
      },
      {
        id: "flats",
        title: "Flats",
        text: "Sectors 01 to 05: courtyard gardens, playgrounds and the mixed-use building.",
      },
      {
        id: "spine",
        title: "Spine and gate",
        text: "The 30 ft road and the entry into the row-house district.",
      },
      {
        id: "row-houses",
        title: "Row houses",
        text: "Homes on 20 ft lanes and a linear garden with a water feature.",
      },
      {
        id: "tip",
        title: "The tip",
        text: "Open lawn, a building on a paved plaza (clubhouse or temple: TBD) and a play area.",
      },
    ] satisfies RouteStop[],
    note: "The route follows the current layout plan and is indicative.",
  },
  amenities: {
    eyebrow: "Amenities",
    heading: "What the plan and renders show.",
    body: "Only what appears in the layout plan or in the renders is listed. Specifications and timelines: TBD.",
    scrollerLabel: "Amenities, scroll sideways for more",
    schematicLabel: "Schematic",
    schematicNote: "Drawn from the plan, no render yet",
  },
  rowHouses: {
    eyebrow: "Row houses",
    heading: "The row-house street.",
    body: "Two storeys under a flat roof terrace. A deep white portal frame around one home, a recessed balcony bay on the next, a red exposed-brick pillar on each pair, planters with creepers under the upper windows and a car porch on the ground floor.",
    dragHint: "Drag sideways to look along the street",
    regionLabel: "Row-house street, scrolls sideways",
    legendTitle: "What to look for",
    plotNote: "Which plots are 2 BHK and which are 3 BHK: TBD.",
    caption: "Row houses by day",
  },
  location: {
    eyebrow: "Location",
    heading: "On the Vapi-Silvassa Road.",
    body: "The township is on the Vapi-Silvassa Road. The map is a schematic: it shows how the places relate, not how far apart they are.",
    labels: { address: "Address", pin: "Pin", landmarks: "Landmarks", distances: "Distances" },
    mapCaption: "Schematic map, not to scale",
    mapTitle: "Schematic map of the Vapi-Silvassa Road between Vapi and Silvassa with the Shiv Shiva Township site marked",
  },
  gallery: {
    eyebrow: "Gallery",
    heading: "The township, frame by frame.",
    body: (count: number): string => `${count} renders. Every image is an artist's impression.`,
  },
  visit: {
    eyebrow: "Visit",
    heading: "Come and see the plan on the ground.",
    body: "Tell us when you would like to visit the site office. We will call you to confirm.",
    cta: "Plan a visit",
    officeLabel: "Site office",
  },
} as const;
