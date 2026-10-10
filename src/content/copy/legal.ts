/**
 * Legal pages: privacy, terms of use and disclaimer. Owner: pages-lead.
 *
 * DRAFT for review by Parshwanath Infra. Written plainly, stating only what this website actually does, claiming no
 * legal compliance, and leaving every unknown as TBD (rendered as a chip). Nothing here is legal advice. The unknowns
 * are listed in the pages-lead report so they reach docs/QUESTIONS.md. No em or en dashes.
 */

export interface LegalSection {
  heading: string;
  paragraphs: readonly string[];
  list?: readonly string[];
}

export interface LegalDoc {
  slug: "privacy" | "terms" | "disclaimer";
  title: string;
  metaDescription: string;
  intro: string;
  sections: readonly LegalSection[];
}

export const privacyDoc: LegalDoc = {
  slug: "privacy",
  title: "Privacy",
  metaDescription: "What the Shiv Shiva Township website does with the details you send. Draft for review by Parshwanath Infra.",
  intro:
    "This page explains, in plain language, what this website does with the information you give it. It is a draft that Parshwanath Infra will review and finalise.",
  sections: [
    {
      heading: "Who this applies to",
      paragraphs: [
        "This website presents Shiv Shiva Township by Parshwanath Infra. The legal name of the company that runs it: TBD.",
      ],
    },
    {
      heading: "What you tell us",
      paragraphs: ["When you send an enquiry, we receive the details you type into the form:"],
      list: [
        "your name and mobile number",
        "your email address, if you add one",
        "the project and the kind of home you are interested in, and a budget range",
        "a preferred visit date and a message, if you add them",
      ],
    },
    {
      heading: "What we record with it",
      paragraphs: [
        "We also record that you ticked the consent box and which page of the site you sent the enquiry from, so the team knows the context.",
      ],
    },
    {
      heading: "Why we use it",
      paragraphs: [
        "The details are used to get back to you about your enquiry and to arrange a visit to the site office. Any other use, such as follow-up messages: TBD.",
      ],
    },
    {
      heading: "Who receives it",
      paragraphs: [
        "Enquiries are delivered to the Parshwanath Infra team by email or recorded in a spreadsheet, through service providers used for that delivery. The providers in use: TBD. If delivery is not available, the form says so and nothing is sent.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: ["Retention period: TBD."],
    },
    {
      heading: "Your choices",
      paragraphs: [
        "You can ask to see, correct or delete the details you sent. How to make a request: TBD.",
      ],
    },
    {
      heading: "Cookies and local storage",
      paragraphs: [
        "This site stores your light or dark theme choice in your browser's local storage, and short flags in session storage that record whether the opening animation has played and which display settings are in use. At the time of writing this draft the site does not use advertising or analytics cookies. This page will be updated if that changes.",
      ],
    },
    {
      heading: "Hosting and technical data",
      paragraphs: [
        "Like any website, the servers that deliver this one process technical data such as your IP address and browser type. Hosting provider: TBD.",
      ],
    },
    {
      heading: "Other websites",
      paragraphs: [
        "Links such as Open in Google Maps lead to services run by other companies. They have their own privacy policies.",
      ],
    },
    {
      heading: "Changes and questions",
      paragraphs: ["This draft may change. Date of the last review: TBD. Contact for privacy questions: TBD."],
    },
  ],
};

export const termsDoc: LegalDoc = {
  slug: "terms",
  title: "Terms of use",
  metaDescription: "Plain-language terms for using the Shiv Shiva Township website. Draft for review by Parshwanath Infra.",
  intro:
    "These terms of use are a plain-language draft for Parshwanath Infra to review. They are not legal advice.",
  sections: [
    {
      heading: "Information only",
      paragraphs: [
        "This website is for information only. It is not an offer, an invitation to invest or a contract.",
      ],
    },
    {
      heading: "Images, plans and counts",
      paragraphs: [
        "Pictures of buildings are artist's impressions. Plans, unit counts, areas and amenities follow the current layout plan and renders and are indicative. They may change with approvals.",
      ],
    },
    {
      heading: "Prices and availability",
      paragraphs: [
        "Prices are not published on this website, and availability is on request. Please ask the site office for current information.",
      ],
    },
    {
      heading: "Using the site",
      paragraphs: [
        "Please do not misuse the site, try to disrupt it, or send enquiries that are false or that belong to someone else.",
      ],
    },
    {
      heading: "Ownership",
      paragraphs: [
        "The text, drawings, renders and design of this site belong to Parshwanath Infra or its licensors. Owner details: TBD. Please ask before copying them.",
      ],
    },
    {
      heading: "Links to other sites",
      paragraphs: ["Links to other sites are for convenience. Parshwanath Infra does not control those sites."],
    },
    {
      heading: "Your purchase",
      paragraphs: [
        "Any purchase is governed only by the formal documents you sign with Parshwanath Infra, not by this website.",
      ],
    },
    {
      heading: "Limits",
      paragraphs: [
        "To the extent the law allows, Parshwanath Infra is not responsible for loss that comes from relying on this website. The extent of that limit: TBD.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: ["Governing law and courts: TBD."],
    },
    {
      heading: "Changes",
      paragraphs: ["These terms may change. Date of the last review: TBD."],
    },
  ],
};

export const disclaimerDoc: LegalDoc = {
  slug: "disclaimer",
  title: "Disclaimer",
  metaDescription:
    "RERA disclaimer, the artist's impression note and the limits of the plans on the Shiv Shiva Township website. Draft for review by Parshwanath Infra.",
  intro:
    "Read this alongside the project page. It is a draft for Parshwanath Infra to review, and it claims no compliance that cannot be checked.",
  sections: [
    {
      heading: "RERA",
      paragraphs: [
        "RERA registration details will be published here once available. RERA registration number: TBD. Registering authority: TBD.",
      ],
    },
    {
      heading: "Artist's impression",
      paragraphs: [
        "Images of buildings are artist's impressions and are indicative only. They show the intended look, landscaping, vehicles and people for illustration. Final construction, finishes, fittings and surroundings may differ.",
      ],
    },
    {
      heading: "Plans, counts and amenities",
      paragraphs: [
        "Plans, areas, counts and specifications shown are indicative and subject to change and approvals. The row-house district on the plan is traced from the current layout plan and is marked indicative. Floors per building, unit areas and availability: TBD.",
      ],
    },
    {
      heading: "Maps, distances and landmarks",
      paragraphs: [
        "The location map is a schematic and is not to scale. Landmarks and distances: TBD.",
      ],
    },
    {
      heading: "Approvals",
      paragraphs: ["Approvals: TBD."],
    },
    {
      heading: "Prices and offers",
      paragraphs: [
        "Price on request. Any price or offer seen elsewhere should be confirmed with Parshwanath Infra before you rely on it.",
      ],
    },
    {
      heading: "Not an offer",
      paragraphs: ["This website is for information only and is not an offer or a contract."],
    },
  ],
};

export const LEGAL_DOCS = { privacy: privacyDoc, terms: termsDoc, disclaimer: disclaimerDoc } as const;
