/**
 * The numbers, drawn as CAD dimension lines (S7 dimensionCount mounts at data-slot="dimension-count").
 * The rows themselves live in DimensionRows (shared with the project overview). Owner: pages-lead.
 */
import { homeCopy } from "@/content/copy/home";
import { shivShiva } from "@/content/projects";
import { Eyebrow } from "@/components/ui/Section";
import { DimensionRows, formatCount } from "./DimensionRows";

export function Numbers() {
  return (
    <section id="numbers" data-slot="dimension-count" aria-labelledby="numbers-title" className="section-pad border-y border-line bg-paper-sunk">
      <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-x-(--gutter)">
        <div className="lg:col-span-5">
          <Eyebrow index="02">{homeCopy.numbers.eyebrow}</Eyebrow>
          <h2 id="numbers-title" className="t-display-2 mt-8 max-w-[14ch] text-ink md:mt-10">
            {homeCopy.numbers.headline(formatCount(shivShiva.counts.total))}
          </h2>
          <p className="t-lead mt-6 max-w-[28rem] text-ink-muted">{homeCopy.numbers.body}</p>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <DimensionRows label={homeCopy.numbers.eyebrow} />
        </div>
      </div>
    </section>
  );
}
