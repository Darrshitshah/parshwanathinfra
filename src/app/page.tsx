/**
 * Home. Owner: pages-lead. Sections in the order BUILD_SPEC section 8 sets out; every section has an id, a heading
 * and (where a Phase 2 experience mounts) a data-slot. No testimonials section: none exist, so none is faked.
 *
 * Slots: sky-descent (hero), dimension-count (numbers), living-plan (plan), amenities,
 * row-house-street, gallery.
 */
import type { Metadata } from "next";
import { Amenities } from "@/components/home/Amenities";
import { BrandStatement } from "@/components/home/BrandStatement";
import { EnquiryCta } from "@/components/home/EnquiryCta";
import { GalleryReel } from "@/components/home/GalleryReel";
import { Hero } from "@/components/home/Hero";
import { Location } from "@/components/home/Location";
import { Numbers } from "@/components/home/Numbers";
import { PlanSection } from "@/components/home/PlanSection";
import { RowHouseStreet } from "@/components/home/RowHouseStreet";
import { BoundaryLoader } from "@/components/loader";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/components/seo/page-metadata";
import { seoCopy } from "@/content/copy/seo";
import { plan } from "@/content/plan";
import { shivShiva } from "@/content/projects";
import { shapeFromPlan } from "@/motion/township";

export const metadata: Metadata = pageMetadata({
  title: seoCopy.homeTitle,
  description: shivShiva.seo.description,
  path: "/",
  absoluteTitle: true,
  useDefaultImage: false,
});

export default function Home() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <BoundaryLoader {...shapeFromPlan(plan)} />
      <Hero />
      <BrandStatement />
      <Numbers />
      <PlanSection />
      <Amenities />
      <RowHouseStreet />
      <Location />
      <GalleryReel />
      <EnquiryCta />
    </>
  );
}
