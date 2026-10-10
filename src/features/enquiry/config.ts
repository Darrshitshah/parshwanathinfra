/**
 * Builds the serialisable EnquiryConfig from the content layer. Server only: it imports src/content (which pulls in
 * zod), so client components receive the result as props and never import this file. Owner: pages-lead.
 */
import { visibleProjects } from "@/content/projects";
import { isTbd } from "@/content/schema";
import { site } from "@/content/site";
import type { EnquiryConfig } from "./types";

export function buildEnquiryConfig(): EnquiryConfig {
  const projects = visibleProjects().map((project) => ({ slug: project.slug, name: project.name }));
  const phones = site.contact.phones.flatMap((phone) =>
    isTbd(phone.number) ? [] : [{ label: phone.label, number: phone.number }],
  );
  const office = site.contact.office;
  return {
    projects,
    defaultProject: projects[0]?.slug ?? "",
    office: { name: office.name, address: office.address, mapUrl: office.mapUrl },
    phones,
    whatsapp: isTbd(site.contact.whatsapp) ? null : site.contact.whatsapp,
  };
}
