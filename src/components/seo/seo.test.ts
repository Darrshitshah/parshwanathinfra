/**
 * SEO tests: every public route has complete metadata, the JSON-LD parses and carries no placeholder values, the
 * sitemap lists the public routes only, robots keeps the dev-only and API paths out, and the page helpers behave.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { shivShiva } from "@/content/projects";
import { site } from "@/content/site";
import { isTbd } from "@/content/schema";
import { metadata as aboutMetadata } from "@/app/about/page";
import { metadata as contactMetadata } from "@/app/contact/page";
import { metadata as disclaimerMetadata } from "@/app/disclaimer/page";
import { metadata as homeMetadata } from "@/app/page";
import { metadata as privacyMetadata } from "@/app/privacy/page";
import { generateMetadata as projectMetadata } from "@/app/projects/[slug]/page";
import { metadata as projectsMetadata } from "@/app/projects/page";
import { metadata as termsMetadata } from "@/app/terms/page";
import { metadata as notFoundMetadata } from "@/app/not-found";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { serializeJsonLd } from "./JsonLd";
import { organizationJsonLd, projectJsonLd, prune, toE164 } from "./json-ld";
import { pageMetadata } from "./page-metadata";
import { publicPaths } from "./routes";
import { absoluteUrl, siteOrigin } from "./site-origin";

const DASHES = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);

afterEach(() => vi.unstubAllEnvs());

/** Every string anywhere inside a JSON value. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

describe("per-page metadata", () => {
  it("is complete on every public route", async () => {
    const byPath: Record<string, unknown> = {
      "/": homeMetadata,
      "/projects": projectsMetadata,
      "/projects/shiv-shiva": await projectMetadata({ params: Promise.resolve({ slug: "shiv-shiva" }) }),
      "/about": aboutMetadata,
      "/contact": contactMetadata,
      "/privacy": privacyMetadata,
      "/terms": termsMetadata,
      "/disclaimer": disclaimerMetadata,
    };
    expect(Object.keys(byPath).sort()).toEqual([...publicPaths()].sort());

    for (const [path, meta] of Object.entries(byPath)) {
      const m = meta as ReturnType<typeof pageMetadata>;
      expect(m.title, `${path} title`).toBeTruthy();
      expect(m.description, `${path} description`).toBeTruthy();
      expect(m.alternates?.canonical, `${path} canonical`).toBe(path);
      expect(m.openGraph?.title, `${path} og:title`).toBeTruthy();
      expect(m.openGraph?.description, `${path} og:description`).toBeTruthy();
      expect(m.openGraph?.url, `${path} og:url`).toBe(path);
      expect(m.twitter, `${path} twitter`).toMatchObject({ card: "summary_large_image", title: expect.any(String), description: expect.any(String) });
      expect(strings(m).filter((text) => DASHES.test(text)), `${path} dashes`).toEqual([]);
      expect(strings(m).filter((text) => isTbd(text)), `${path} TBD`).toEqual([]);
    }
  });

  it("gives Home and the project an absolute title and the other pages the brand suffix", () => {
    expect(homeMetadata.title).toEqual({ absolute: expect.stringContaining("Shiv Shiva Township") });
    expect(aboutMetadata.title).toBe("About");
    expect(aboutMetadata.openGraph?.title).toBe(`About · ${site.name}`);
  });

  it("names the default card on pages without an image file, and leaves Home and the project to theirs", async () => {
    expect(aboutMetadata.openGraph?.images).toEqual([expect.objectContaining({ url: "/opengraph-image", width: 1200, height: 630 })]);
    expect(aboutMetadata.twitter?.images).toEqual([expect.objectContaining({ url: "/opengraph-image" })]);
    expect(homeMetadata.openGraph?.images).toBeUndefined();
    const project = await projectMetadata({ params: Promise.resolve({ slug: "shiv-shiva" }) });
    expect(project.openGraph?.images).toBeUndefined();
  });

  it("marks the 404 noindex", () => {
    expect(notFoundMetadata.robots).toMatchObject({ index: false });
  });

  it("builds the project page from the project's own SEO fields", async () => {
    const meta = await projectMetadata({ params: Promise.resolve({ slug: "shiv-shiva" }) });
    expect(meta.title).toEqual({ absolute: shivShiva.seo.title });
    expect(meta.description).toBe(shivShiva.seo.description);
    expect(await projectMetadata({ params: Promise.resolve({ slug: "nope" }) })).toEqual({});
  });
});

describe("site origin", () => {
  it("falls back to localhost and strips trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(siteOrigin()).toBe("http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.test///");
    expect(siteOrigin()).toBe("https://example.test");
    expect(absoluteUrl("/projects")).toBe("https://example.test/projects");
    expect(absoluteUrl("/")).toBe("https://example.test");
  });
});

describe("JSON-LD", () => {
  it("prunes unknown values", () => {
    expect(prune({ a: "TBD", b: "", c: null, d: undefined, e: [], f: { "@type": "X", g: "TBD" }, h: ["TBD", "ok"], i: 0 })).toEqual({ h: ["ok"], i: 0 });
  });

  it("formats Indian mobile numbers internationally", () => {
    expect(toE164("7874305000")).toBe("+917874305000");
    expect(toE164("+91 78743 05000")).toBe("+91 78743 05000");
  });

  it("describes Parshwanath Infra with both phones, the office and the geo point", () => {
    const org = organizationJsonLd() as Record<string, unknown>;
    expect(org["@context"]).toBe("https://schema.org");
    expect(org["@type"]).toBe("RealEstateAgent");
    expect(org.legalName).toBe("Parshwanath Infra Pvt. Ltd.");
    expect(org.telephone).toEqual(["+917874305000", "+917874306000"]);
    expect(org.address).toMatchObject({ streetAddress: site.contact.office.address, addressCountry: "IN" });
    expect(org.geo).toEqual({ "@type": "GeoCoordinates", latitude: site.contact.office.geo.lat, longitude: site.contact.office.geo.lng });
    expect(org).not.toHaveProperty("email");
  });

  it("describes the township with confirmed counts only", () => {
    const graph = (projectJsonLd(shivShiva) as { "@graph": Array<Record<string, unknown>> })["@graph"];
    const township = graph.find((node) => node["@type"] === "ApartmentComplex");
    expect(graph.map((node) => node["@type"])).toEqual(["RealEstateAgent", "ApartmentComplex"]);
    expect(township).toBeDefined();
    expect(township?.numberOfAccommodationUnits).toBe(shivShiva.counts.flats + shivShiva.counts.rowHouses);
    expect(township?.geo).toMatchObject({ latitude: shivShiva.location.geo.lat, longitude: shivShiva.location.geo.lng });
    expect(township?.address).toMatchObject({ addressLocality: "Karamkhal", addressCountry: "IN" });
    expect(township).not.toHaveProperty("offers");
    expect(township).not.toHaveProperty("priceRange");
  });

  it("serialises to parseable JSON with no placeholder, RERA, price or dash anywhere", () => {
    for (const data of [organizationJsonLd(), projectJsonLd(shivShiva)]) {
      const text = serializeJsonLd(data);
      expect(() => JSON.parse(text)).not.toThrow();
      expect(text).not.toMatch(/TBD/);
      expect(text).not.toMatch(/rera/i);
      expect(text).not.toMatch(/price/i);
      expect(DASHES.test(text)).toBe(false);
    }
  });

  it("escapes angle brackets so a value cannot close the script element", () => {
    expect(serializeJsonLd({ a: "</script><b>" })).not.toContain("<");
  });
});

describe("sitemap and robots", () => {
  it("lists the public routes and nothing else", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.test");
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual([
      "https://example.test",
      "https://example.test/projects",
      "https://example.test/projects/shiv-shiva",
      "https://example.test/about",
      "https://example.test/contact",
      "https://example.test/privacy",
      "https://example.test/terms",
      "https://example.test/disclaimer",
    ]);
    expect(urls.some((url) => /motion-lab|\/api/.test(url))).toBe(false);
  });

  it("keeps /motion-lab and /api out of the index and points at the sitemap", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.test");
    const config = robots();
    const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toEqual(expect.arrayContaining(["/motion-lab", "/api/"]));
    expect(config.sitemap).toBe("https://example.test/sitemap.xml");
  });
});
