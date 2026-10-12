/**
 * The project detail page body: hero, sticky sub-nav and the sections in the order the sub-nav lists them.
 *
 * Slots for Phase 2: living-plan (#plan), units and explorer (#homes), row-house-street (#row-houses),
 * amenities, gallery. Owner: pages-lead.
 */
import { Amenities } from "@/components/home/Amenities";
import { EnquiryCta } from "@/components/home/EnquiryCta";
import { GalleryReel } from "@/components/home/GalleryReel";
import { Location } from "@/components/home/Location";
import { PlanSection } from "@/components/home/PlanSection";
import { RowHouseStreet } from "@/components/home/RowHouseStreet";
import { projectCopy } from "@/content/copy/project";
import type { Project } from "@/content/schema";
import { BrochureSection } from "./BrochureSection";
import { Homes } from "./Homes";
import { Overview } from "./Overview";
import { ProjectHero } from "./ProjectHero";
import { SubNav } from "./SubNav";

export function ProjectView({ project }: { project: Project }) {
  return (
    <>
      <ProjectHero project={project} />
      <SubNav items={projectCopy.subnav} label={projectCopy.subnavLabel} />
      <Overview project={project} />
      <PlanSection id="plan" index="02" layout="wide" showLink={false} tone="mist" />
      <Homes project={project} />
      <RowHouseStreet id="row-houses" index="04" tone="ink" />
      <Amenities id="amenities" index="05" />
      <Location id="location" index="06" tone="mist" />
      <GalleryReel id="gallery" index="07" />
      <BrochureSection project={project} />
      <EnquiryCta id="enquire" index="09" />
    </>
  );
}
