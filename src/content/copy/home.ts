/**
 * Home page copy. Owner: pages-lead. Page copy that is not a fact: facts (counts, address, names) are read from
 * src/content and composed in the components. Any "TBD" token in a string renders as a visible TBD chip.
 * No em or en dashes.
 */

export const homeCopy = {
  hero: {
    eyebrow: "An integrated township",
    by: "by Parshwanath Infra",
    statement: "Flats, row houses and shops, planned together as one neighbourhood on the Vapi-Silvassa Road.",
    posterCaption: "The township from the air at golden hour",
  },
  idea: {
    eyebrow: "The idea",
    text: "Every street, garden and shopfront in Shiv Shiva belongs to one plan. Flats, row houses and shops, planned together as a single *neighbourhood*.",
  },
  numbers: {
    eyebrow: "The numbers",
    headline: (total: string): string => `${total} flats, row houses and shops on one plan.`,
    body: "Counts for the whole township. Each bar below shows that kind of home as a share of the total.",
    unit: "units",
  },
  plan: {
    eyebrow: "The plan",
    heading: "One plan, the whole *township*.",
    body: "One layout holds the whole township: the Vapi-Silvassa Road and the main entry, the roundabout, the flat blocks, the shops at the gate and the row-house district beyond.",
    note: "Row-house district: indicative, as per the current layout plan.",
    figureCaption: "Layout from directly above",
    legendTitle: "Marked on the plan",
  },
  amenities: {
    eyebrow: "Amenities",
    heading: "What the plan and renders *show*.",
    body: "Only what appears in the layout plan or in the renders is listed. Specifications and timelines: TBD.",
    scrollerLabel: "Amenities, scroll sideways for more",
  },
  rowHouses: {
    eyebrow: "Row houses",
    heading: "The row-house *street*.",
    body: "Two storeys under a flat roof terrace. A deep white portal frame around one home, a recessed balcony bay on the next, a red exposed-brick pillar on each pair, planters with creepers under the upper windows and a car porch on the ground floor.",
    dragHint: "Drag sideways to look along the street",
    regionLabel: "Row-house street, scrolls sideways",
    legendTitle: "What to look for",
    plotNote: "Which plots are 2 BHK and which are 3 BHK: TBD.",
    caption: "Row houses by day",
  },
  location: {
    eyebrow: "Location",
    heading: "On the Vapi-Silvassa *Road*.",
    body: "The township is on the Vapi-Silvassa Road. The map marks the site with a gold pin and shows the road between Vapi and Silvassa. It is indicative.",
    labels: { address: "Address", pin: "Pin", landmarks: "Landmarks", distances: "Distances" },
    /** Caption under the schematic: the server render, the view while the street map loads, and the fallback. */
    mapCaption: "Schematic map, not to scale",
    mapTitle: "Schematic map of the Vapi-Silvassa Road between Vapi and Silvassa with the Shiv Shiva Township site marked",
    /** Caption under the live street map. */
    liveCaption: "Indicative location. Map data from OpenStreetMap contributors.",
    map: {
      siteLabel: "Site",
      regionLabel: "Street map of Shiv Shiva Township on the Vapi-Silvassa Road",
      controlsLabel: "Map controls",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      recenter: "Centre on the site",
      gestures: {
        windows: "Use Ctrl + scroll to zoom the map",
        mac: "Use ⌘ + scroll to zoom the map",
        mobile: "Use two fingers to move the map",
      },
      /** The credit the map data and tile licences ask for, shown on the live map. */
      attribution: [
        { label: "© OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright" },
        { label: "OpenMapTiles", href: "https://openmaptiles.org/" },
        { label: "OpenFreeMap", href: "https://openfreemap.org/" },
      ],
    },
  },
  gallery: {
    eyebrow: "Gallery",
    heading: "The township, frame by *frame*.",
    body: (count: number): string => `${count} renders. Every image is an artist's impression.`,
  },
  visit: {
    eyebrow: "Visit",
    heading: "Come and see the plan on the *ground*.",
    body: "Tell us when you would like to visit the site office. We will call you to confirm.",
    cta: "Plan a visit",
    officeLabel: "Site office",
  },
} as const;
