/**
 * UI strings (English). Owner: pages-lead. Structured so Hindi and Gujarati can be added as sibling files with the
 * same keys. No em or en dashes.
 */
export const en = {
  brand: {
    company: "Parshwanath Infra",
    flagship: "Shiv Shiva Township",
  },
  nav: {
    home: "Home",
    projects: "Projects",
    about: "About",
    contact: "Contact",
    enquire: "Enquire",
    menu: "Menu",
    close: "Close",
    skipToContent: "Skip to content",
  },
  common: {
    tbd: "TBD",
    tbdTitle: "To be confirmed",
    artistsImpression: "Artist's impression",
    asPerPlan: "As per plan",
    indicative: "Indicative",
    availabilityOnRequest: "Availability on request",
    priceOnRequest: "Price on request",
    openInMaps: "Open in Google Maps",
    explorePlan: "Explore the plan",
    viewGallery: "View gallery",
  },
  legal: {
    reraLabel: "RERA registration",
  },
  enquiry: {
    open: "Enquire",
    title: "Plan a visit",
    submit: "Send enquiry",
    sending: "Sending",
    success: "Thank you. We will call you to confirm your visit.",
    notConfigured: "Online enquiries are not switched on yet. Please call or message us instead.",
    error: "Something went wrong. Please try again, or call us.",
  },
} as const;

export type Strings = typeof en;
