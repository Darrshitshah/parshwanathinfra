/**
 * Home. Owner: pages-lead. Sections in the order BUILD_SPEC section 8 sets out; every section has an id, a heading
 * and (where a Phase 2 experience mounts) a data-slot. No testimonials section: none exist, so none is faked.
 *
 * Slots: sky-descent (hero), dimension-count (numbers), living-plan (plan), diorama (walk), amenities,
 * row-house-street, gallery.
 */
import type { Metadata } from "next";
import { Amenities } from "@/components/home/Amenities";
import { BrandStatement } from "@/components/home/BrandStatement";
import { Diorama } from "@/components/home/Diorama";
import { EnquiryCta } from "@/components/home/EnquiryCta";
import { GalleryReel } from "@/components/home/GalleryReel";
import { Hero } from "@/components/home/Hero";
import { Location } from "@/components/home/Location";
import { Numbers } from "@/components/home/Numbers";
import { PlanSection } from "@/components/home/PlanSection";
import { RowHouseStreet } from "@/components/home/RowHouseStreet";
import { shivShiva } from "@/content/projects";

export const metadata: Metadata = {
  description: shivShiva.seo.description,
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <Hero />
      <BrandStatement />
      <Numbers />
      <PlanSection />
      <Diorama />
      <Amenities />
      <RowHouseStreet />
      <Location />
      <GalleryReel />
      <EnquiryCta />
    </>
  );
}
