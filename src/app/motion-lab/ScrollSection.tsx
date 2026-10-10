"use client";

import Image from "next/image";
import { getMedia } from "@/content/media";
import { DimensionStat, Parallax, Reveal } from "@/motion/Reveal";
import { LabSection } from "./lab-ui";

const GALLERY = ["row-houses-day", "row-house-street", "row-house-wing"] as const;

/** The scroll hooks through <Reveal>: scroll down slowly and reload to replay. Tier C shows everything, still. */
export function ScrollSection() {
  const wide = getMedia("masterplan-full");
  return (
    <LabSection
      id="scroll"
      title="Scroll-triggered: Reveal, DimensionStat, Parallax"
      note="These play once when they scroll into view and do nothing on Tier C, so the content is always readable. Reload the page to see them again. The numbers are the unit mix from the build spec."
    >
      <div className="space-y-24 pb-24">
        <Reveal kind="split" as="h3" className="max-w-3xl font-display text-5xl leading-tight text-ink">
          Every transition is cut from a shape in the plan.
        </Reveal>

        <Reveal kind="fade" className="max-w-xl text-ink-muted">
          Fade and rise: the simplest reveal, for cards and blocks. Transform and opacity only.
        </Reveal>

        <div className="grid max-w-3xl gap-10 sm:grid-cols-3">
          <DimensionStat value={1250} label="Flats" />
          <DimensionStat value={165} label="Row houses" />
          <DimensionStat value={1565} label="Homes in all" />
        </div>

        <Reveal kind="wipe" className="max-w-2xl pt-6">
          <p className="font-display text-3xl text-ink">The 40-foot boulevard, as a wipe.</p>
        </Reveal>

        <Reveal kind="blinds" className="grid gap-4 sm:grid-cols-3">
          {GALLERY.map((id) => {
            const picture = getMedia(id);
            return (
              <div key={id} data-blinds-item="" className="relative aspect-4/5 overflow-hidden bg-paper-sunk">
                <Image src={picture.src} alt={picture.alt} fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
              </div>
            );
          })}
        </Reveal>

        <Parallax amount={9} className="aspect-21/9 max-w-4xl bg-paper-sunk">
          <Image src={wide.src} alt={wide.alt} width={wide.width} height={wide.height} className="h-full w-full object-cover" />
        </Parallax>
        <p className="font-mono text-xs text-ink-muted">Artist&apos;s impression · parallax runs on Tier A only</p>
      </div>
    </LabSection>
  );
}
