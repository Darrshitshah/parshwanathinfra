/**
 * The numbers: a deep-maroon colour block with the counts as big numerals and share bars (S7 dimensionCount mounts at
 * data-slot="dimension-count"). The rows themselves live in DimensionRows (shared with the project overview).
 * Owner: pages-lead.
 */
import { homeCopy } from "@/content/copy/home";
import { shivShiva } from "@/content/projects";
import { Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/motion/Reveal";
import { DimensionRows, formatCount } from "./DimensionRows";

export function Numbers() {
  return (
    <section id="numbers" data-slot="dimension-count" aria-labelledby="numbers-title" className="tone-jewel sheet">
      <div className="wrap grid gap-16 lg:grid-cols-12 lg:gap-x-(--gutter)">
        <div className="lg:col-span-5">
          <Eyebrow index="02">{homeCopy.numbers.eyebrow}</Eyebrow>
          <Reveal kind="split" as="h2" id="numbers-title" className="t-display-2 mt-8 max-w-[12ch] text-ink md:mt-10">
            {homeCopy.numbers.headline(formatCount(shivShiva.counts.total))}
          </Reveal>
          <p className="t-lead mt-8 max-w-[26rem] text-ink-muted">{homeCopy.numbers.body}</p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <DimensionRows label={homeCopy.numbers.eyebrow} />
        </div>
      </div>
    </section>
  );
}
