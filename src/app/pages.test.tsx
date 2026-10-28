// @vitest-environment jsdom
/**
 * Smoke and structure tests for every page: one h1, a sane heading outline, labelled sections, unique ids, real alt
 * text, working in-page anchors, the slots Phase 2 mounts into, visible TBD chips where a fact is unknown, and no em
 * or en dashes in anything a visitor can read.
 */
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { shivShiva } from "@/content/projects";
import AboutPage, { metadata as aboutMetadata } from "./about/page";
import ContactPage, { metadata as contactMetadata } from "./contact/page";
import DisclaimerPage from "./disclaimer/page";
import Home, { metadata as homeMetadata } from "./page";
import NotFound from "./not-found";
import PrivacyPage from "./privacy/page";
import ProjectPage, { generateMetadata, generateStaticParams } from "./projects/[slug]/page";
import ProjectsPage, { metadata as projectsMetadata } from "./projects/page";
import TermsPage from "./terms/page";

// Client components may read the app router; the tests render the pages without one.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }) }));

const DASHES = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
const KNOWN_ROUTES = new Set(["/", "/projects", "/projects/shiv-shiva", "/about", "/contact", "/privacy", "/terms", "/disclaimer"]);

beforeAll(() => {
  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("IntersectionObserver", Observer);
  vi.stubGlobal("ResizeObserver", Observer);
  vi.stubGlobal("CSS", { escape: (value: string) => value });
  window.matchMedia = vi.fn(
    (query: string) => ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList,
  ) as unknown as typeof window.matchMedia;
  Element.prototype.scrollTo = () => undefined;
});

afterEach(cleanup);

function headingLevels(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((heading) => Number(heading.tagName.slice(1)));
}

function expectSoundStructure(container: HTMLElement) {
  // Exactly one h1, and the outline never skips a level going down.
  const levels = headingLevels(container);
  expect(levels.filter((level) => level === 1)).toHaveLength(1);
  levels.reduce((previous, level) => {
    expect(level).toBeLessThanOrEqual(previous + 1);
    return level;
  }, 0);

  // Ids are unique, and every labelled region is labelled by a heading that exists.
  const ids = Array.from(container.querySelectorAll("[id]")).map((element) => element.id);
  expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  for (const region of container.querySelectorAll("section[aria-labelledby]")) {
    const target = region.getAttribute("aria-labelledby") ?? "";
    expect(container.querySelector(`[id="${target}"]`), `section #${region.id} is labelled by ${target}`).not.toBeNull();
  }

  // Every image has alt text; an empty alt is only for decoration inside a hidden link.
  for (const image of container.querySelectorAll("img")) {
    const alt = image.getAttribute("alt");
    expect(alt, "img without alt").not.toBeNull();
    if (alt === "") expect(image.closest("[aria-hidden='true']")).not.toBeNull();
    else expect((alt ?? "").length).toBeGreaterThan(8);
  }

  // In-page anchors land somewhere, and internal links go to pages that exist.
  for (const link of container.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const href = link.getAttribute("href") ?? "";
    if (href.startsWith("#")) expect(container.querySelector(`[id="${href.slice(1)}"]`), `anchor ${href}`).not.toBeNull();
    else if (href.startsWith("/")) expect(KNOWN_ROUTES.has(href.split("#")[0] ?? ""), `route ${href}`).toBe(true);
  }

  // Nothing a visitor reads contains an em or en dash.
  expect(container.textContent).not.toMatch(DASHES);
}

function renderPage(page: ReactElement) {
  return render(page).container;
}

describe("Home", () => {
  it("has the sections of BUILD_SPEC section 8 in order, each with the slot Phase 2 mounts into", () => {
    const container = renderPage(<Home />);
    const sections = Array.from(container.querySelectorAll("section")).map((section) => section.id);
    expect(sections).toEqual(["top", "idea", "numbers", "plan", "amenities", "row-houses", "location", "gallery", "visit"]);
    const slots = Array.from(container.querySelectorAll("[data-slot]")).map((element) => `${element.id}:${element.getAttribute("data-slot")}`);
    expect(slots).toEqual([
      "top:sky-descent",
      "numbers:dimension-count",
      "plan:living-plan",
      "amenities:amenities",
      "row-houses:row-house-street",
      "gallery:gallery",
    ]);
  });

  it("is structurally sound and shows no testimonials", () => {
    const container = renderPage(<Home />);
    expectSoundStructure(container);
    expect(container.textContent).not.toMatch(/testimonial/i);
  });

  it("makes the hero image the preloaded LCP candidate, marked for the loader", () => {
    const container = renderPage(<Home />);
    const hero = container.querySelector("img[data-hero-image]");
    expect(hero).not.toBeNull();
    expect(hero?.getAttribute("fetchpriority")).toBe("high");
    expect(hero?.getAttribute("loading")).not.toBe("lazy");
    expect(hero?.closest("[data-hero-poster]")).not.toBeNull();
  });

  it("shows the four confirmed counts as dimension lines that add up", () => {
    const container = renderPage(<Home />);
    const rows = Array.from(container.querySelectorAll<HTMLElement>("[data-dimension]"));
    const values = rows.map((row) => Number(row.getAttribute("data-value")));
    expect(values).toEqual([1250, 165, 150, 1565]);
    expect(values[0] + values[1] + values[2]).toBe(values[3]);
    expect(rows[3]?.querySelector("[data-dim-line]")).not.toBeNull();
    expect(rows[3]?.querySelectorAll("[data-dim-tick]")).toHaveLength(2);
  });

  it("labels every amenity with its evidence and shows the linear garden as an artist's impression, not a schematic", () => {
    const container = renderPage(<Home />);
    const cards = Array.from(container.querySelectorAll("[data-amenity]"));
    expect(cards).toHaveLength(shivShiva.amenities.length);
    for (const card of cards) expect(card.textContent).toMatch(/As per plan|As shown in renders/);
    const linear = container.querySelector("[data-amenity='linear-garden']");
    expect(linear?.querySelector("svg")).toBeNull();
    expect(linear?.querySelector("img")?.getAttribute("src")).toContain("linear-garden");
    expect(linear?.textContent).toMatch(/As per plan/);
    expect(linear?.textContent).not.toMatch(/Schematic|no render yet/);
  });

  it("lists the seven row-house features without pins or numbers", () => {
    const container = renderPage(<Home />);
    const street = container.querySelector("#row-houses");
    expect(street?.querySelectorAll(".callout")).toHaveLength(0);
    expect(street?.querySelector("[data-callouts]")).toBeNull();
    expect(street?.querySelectorAll("ul[aria-label] li")).toHaveLength(7);
    expect(street?.querySelector(".legend__n")).toBeNull();
    for (const feature of [/portal frame/i, /balcony bay/i, /brick pillar/i, /planters/i, /car porch/i, /two storeys/i, /flat roof/i]) {
      expect(street?.textContent).toMatch(feature);
    }
  });

  it("shows the labelled schematic in the location map when the browser has no WebGL (jsdom), with landmarks and distances as TBD", () => {
    const container = renderPage(<Home />);
    const location = container.querySelector("#location");
    const frame = location?.querySelector("[data-site-map]");
    expect(frame?.getAttribute("data-state")).toBe("fallback");
    expect(location?.textContent).toMatch(/not to scale/i);
    expect(location?.querySelector("svg[role='img']")).not.toBeNull();
    expect(location?.querySelectorAll("[data-tbd]").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("link", { name: /open in google maps/i }).length).toBeGreaterThan(0);
  });

  it("lists every gallery image with the artist's impression label", () => {
    const container = renderPage(<Home />);
    const frames = container.querySelectorAll("[data-gallery-item]");
    expect(frames).toHaveLength(shivShiva.galleryIds.length);
    expect(container.querySelectorAll("#gallery .tag-impression")).toHaveLength(frames.length);
  });

  it("carries page metadata from the content", () => {
    expect(homeMetadata.description).toBe(shivShiva.seo.description);
    expect(homeMetadata.alternates?.canonical).toBe("/");
  });
});

describe("Project page", () => {
  async function renderProject() {
    return renderPage(await ProjectPage({ params: Promise.resolve({ slug: "shiv-shiva" }) }));
  }

  it("generates only the Shiv Shiva page and 404s anything else", async () => {
    expect(generateStaticParams()).toEqual([{ slug: "shiv-shiva" }]);
    await expect(ProjectPage({ params: Promise.resolve({ slug: "unknown" }) })).rejects.toThrow();
  });

  it("builds its metadata from the project content", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "shiv-shiva" }) });
    expect(metadata.title).toEqual({ absolute: shivShiva.seo.title });
    expect(metadata.description).toBe(shivShiva.seo.description);
    expect(metadata.alternates?.canonical).toBe("/projects/shiv-shiva");
    expect(await generateMetadata({ params: Promise.resolve({ slug: "unknown" }) })).toEqual({});
  });

  it("has the sub-nav items and a section for each, in order", async () => {
    const container = await renderProject();
    const nav = container.querySelector("[data-project-subnav]");
    const labels = Array.from(nav?.querySelectorAll("a") ?? []).map((link) => link.textContent);
    expect(labels).toEqual(["Overview", "Plan", "Homes", "Row houses", "Amenities", "Location", "Gallery", "Brochure", "Enquire"]);
    const targets = Array.from(nav?.querySelectorAll("a") ?? []).map((link) => link.getAttribute("href")?.slice(1) ?? "");
    for (const id of targets) expect(container.querySelector(`section[id="${id}"]`), `section #${id}`).not.toBeNull();
    const order = Array.from(container.querySelectorAll("section[id]")).map((section) => section.id);
    expect(targets.filter((id) => order.includes(id))).toEqual(targets);
    expect(order.indexOf("overview")).toBeLessThan(order.indexOf("plan"));
    expect(order.indexOf("brochure")).toBeLessThan(order.indexOf("enquire"));
  });

  it("is structurally sound", async () => {
    expectSoundStructure(await renderProject());
  });

  it("mounts the plan, units, explorer, row-house, amenities and gallery slots", async () => {
    const container = await renderProject();
    expect(container.querySelector("#plan")).toHaveAttribute("data-slot", "living-plan");
    expect(container.querySelector("[data-slot='units']")).not.toBeNull();
    expect(container.querySelector("[data-slot='explorer']")).not.toBeNull();
    expect(container.querySelector("#row-houses")).toHaveAttribute("data-slot", "row-house-street");
    expect(container.querySelector("#amenities")).toHaveAttribute("data-slot", "amenities");
    expect(container.querySelector("#gallery")).toHaveAttribute("data-slot", "gallery");
  });

  it("shows no RERA text, the price on request and a disabled brochure button", async () => {
    const container = await renderProject();
    expect(container.querySelector("[data-rera-line]")).toBeNull();
    expect(container.textContent).not.toMatch(/rera/i);
    expect(container.querySelector("#brochure")?.textContent).toContain("Price on request");
    const brochure = container.querySelector<HTMLButtonElement>("#brochure [data-brochure]");
    expect(brochure).toBeDisabled();
    expect(brochure?.textContent).toMatch(/Brochure:/);
    expect(brochure?.querySelector("[data-tbd]")).not.toBeNull();
  });

  it("leaves possession, land area and approvals as visible TBD chips", async () => {
    const container = await renderProject();
    const facts = container.querySelector("#overview")?.textContent ?? "";
    for (const label of ["Possession", "Land area", "Approvals"]) expect(facts).toContain(label);
    expect(container.querySelectorAll("#overview [data-tbd]").length).toBeGreaterThanOrEqual(3);
  });
});

describe("Projects index", () => {
  it("lists Shiv Shiva and nothing else", () => {
    const container = renderPage(<ProjectsPage />);
    expectSoundStructure(container);
    const projects = container.querySelectorAll("[data-project]");
    expect(projects).toHaveLength(1);
    expect(projects[0]).toHaveAttribute("data-project", "shiv-shiva");
    expect(projectsMetadata.title).toBe("Projects");
  });
});

describe("About", () => {
  it("states only the known facts and the one known milestone", () => {
    const container = renderPage(<AboutPage />);
    expectSoundStructure(container);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Parshwanath Infra is the developer of Shiv Shiva Township/);
    expect(screen.getByText("2024 · Shiv Shiva Township development begins")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-milestone]")).toHaveLength(1);
    expect(container.textContent).toMatch(/will be added here once they are confirmed/);
    expect(container.textContent).not.toMatch(/founded|established|since 19|since 20(0|1)|award|years of experience/i);
    expect(aboutMetadata.title).toBe("About");
  });

  it("shows the confirmed legal name", () => {
    renderPage(<AboutPage />);
    const cell = screen.getByText("Legal name").closest(".titleblock__cell");
    expect(cell).toHaveTextContent("Parshwanath Infra Pvt. Ltd.");
  });
});

describe("Contact", () => {
  it("puts the enquiry form beside the office, with email and hours as TBD", () => {
    const container = renderPage(<ContactPage />);
    expectSoundStructure(container);
    expect(container.querySelector("form[data-enquiry-form]")).not.toBeNull();
    const details = container.querySelector("aside");
    expect(details?.textContent).toContain("Opp. Haryana Hotel");
    expect(details?.querySelectorAll("[data-tbd]")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /get directions/i })[0]?.getAttribute("href")).toContain("google.com/maps/dir");
    expect(contactMetadata.title).toBe("Contact");
  });

  it("links both sales numbers and the WhatsApp number, but not the unknown email", () => {
    const container = renderPage(<ContactPage />);
    const tel = Array.from(container.querySelectorAll("aside a[href^='tel:']")).map((link) => link.getAttribute("href"));
    expect(tel).toEqual(["tel:+917874305000", "tel:+917874306000"]);
    expect(container.querySelector("aside a[href='https://wa.me/917874305000']")).not.toBeNull();
    expect(container.querySelector("a[href^='mailto:']")).toBeNull();
  });
});

describe.each([
  ["Privacy", PrivacyPage],
  ["Terms of use", TermsPage],
  ["Disclaimer", DisclaimerPage],
])("%s", (title, Page) => {
  it("is marked as a draft for review and claims no compliance", () => {
    const container = renderPage(<Page />);
    expectSoundStructure(container);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(title);
    expect(container.querySelector("[data-draft-banner]")?.textContent).toContain("Draft for review by Parshwanath Infra");
    expect(container.textContent).toMatch(/makes no claim of legal compliance/);
    expect(container.textContent).not.toMatch(/fully compliant|complies with|in accordance with the (law|act)/i);
    // Unknowns stay visible as TBD chips.
    expect(container.querySelectorAll("[data-tbd]").length).toBeGreaterThanOrEqual(2);
  });
});

describe("No RERA anywhere", () => {
  it.each([
    ["Home", <Home key="h" />],
    ["Projects", <ProjectsPage key="p" />],
    ["About", <AboutPage key="a" />],
    ["Contact", <ContactPage key="c" />],
    ["Privacy", <PrivacyPage key="pr" />],
    ["Terms", <TermsPage key="t" />],
    ["Disclaimer", <DisclaimerPage key="d" />],
    ["404", <NotFound key="n" />],
  ])("%s mentions no RERA", (_name, page) => {
    expect(renderPage(page).textContent).not.toMatch(/rera/i);
  });
});

describe("Disclaimer content", () => {
  it("carries the artist's impression note and no RERA section", () => {
    const container = renderPage(<DisclaimerPage />);
    expect(container.textContent).toMatch(/artist's impressions and are indicative only/);
    expect(container.textContent).not.toMatch(/rera/i);
  });
});

describe("404", () => {
  it("says you are off the plan, draws the township boundary and offers the way back", () => {
    const container = renderPage(<NotFound />);
    expectSoundStructure(container);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("You are off the plan.");
    const drawing = container.querySelector("[data-not-found-plan] svg[role='img']");
    expect(drawing).not.toBeNull();
    expect(drawing?.querySelector("path.draw-path")?.getAttribute("d")?.length).toBeGreaterThan(200);
    expect(screen.getByRole("link", { name: /back to the plan/i })).toHaveAttribute("href", "/");
  });
});
