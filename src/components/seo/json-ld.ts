/**
 * JSON-LD builders. Owner: pages-lead. Everything is read from the content layer; any value that is unknown ("TBD"),
 * empty or undefined is dropped before output, so a placeholder can never reach a search engine. No RERA, no price
 * (it is "Price on request"), no rating, no opening hours.
 */
import { isTbd } from "@/content/schema";
import type { Project } from "@/content/schema";
import { getMedia } from "@/content/media";
import { site } from "@/content/site";
import { seoCopy } from "@/content/copy/seo";
import { absoluteUrl } from "./site-origin";
import { projectPath } from "./routes";

type JsonValue = string | number | boolean | null | undefined | JsonValue[] | { [key: string]: JsonValue };

/** Removes undefined, null, "TBD", empty strings, empty arrays and objects that end up empty. */
export function prune(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    const items = value.map(prune).filter((item) => item !== undefined);
    return items.length > 0 ? items : undefined;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, prune(item)] as const)
      .filter(([, item]) => item !== undefined);
    // A node that only carries @type (or @id) says nothing, so it is dropped too.
    const meaningful = entries.filter(([key]) => key !== "@type" && key !== "@id");
    return meaningful.length > 0 ? Object.fromEntries(entries) : undefined;
  }
  if (value === null || value === undefined || isTbd(value)) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

/** Indian mobile numbers are stored as ten digits: structured data wants the international form. */
export function toE164(number: string): string {
  const digits = number.replace(/\D/g, "");
  return digits.length === 10 ? `+91${digits}` : number;
}

const ORGANIZATION_ID = () => absoluteUrl("/#organization");

function organizationNode(): JsonValue {
  const { contact } = site;
  const phones = contact.phones.map((phone) => ({ label: phone.label, telephone: toE164(phone.number) }));
  const office = contact.office;
  return {
    "@type": "RealEstateAgent",
    "@id": ORGANIZATION_ID(),
    name: site.name,
    legalName: site.legalName,
    description: seoCopy.jsonLd.organizationDescription,
    url: absoluteUrl("/"),
    telephone: phones.map((phone) => phone.telephone),
    email: contact.email,
    contactPoint: phones.map((phone) => ({
      "@type": "ContactPoint",
      telephone: phone.telephone,
      contactType: phone.label,
    })),
    address: {
      "@type": "PostalAddress",
      streetAddress: office.address,
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: office.geo.lat,
      longitude: office.geo.lng,
    },
    hasMap: office.mapUrl,
  };
}

function projectNode(project: Project): JsonValue {
  const hero = getMedia(project.heroMediaId);
  const { location, counts } = project;
  return {
    "@type": "ApartmentComplex",
    "@id": absoluteUrl(`${projectPath(project.slug)}#residence`),
    name: project.name,
    description: project.seo.description,
    url: absoluteUrl(projectPath(project.slug)),
    image: {
      "@type": "ImageObject",
      url: absoluteUrl(hero.src),
      width: hero.width,
      height: hero.height,
      caption: hero.artistImpression ? `${seoCopy.og.artistImpression}: ${hero.caption}` : hero.caption,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: location.address,
      addressLocality: location.village,
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: location.geo.lat,
      longitude: location.geo.lng,
    },
    hasMap: location.mapUrl,
    // Homes only: the confirmed flats plus row houses. The shops are commercial units, not accommodation.
    numberOfAccommodationUnits: counts.flats + counts.rowHouses,
  };
}

function withContext(nodes: JsonValue[]): Record<string, JsonValue> {
  const pruned = nodes.map(prune).filter((node) => node !== undefined);
  return pruned.length === 1
    ? { "@context": "https://schema.org", ...(pruned[0] as Record<string, JsonValue>) }
    : { "@context": "https://schema.org", "@graph": pruned };
}

export function organizationJsonLd(): Record<string, JsonValue> {
  return withContext([organizationNode()]);
}

/** The developer and the township as one linked graph, for the project page. */
export function projectJsonLd(project: Project): Record<string, JsonValue> {
  return withContext([organizationNode(), projectNode(project)]);
}
