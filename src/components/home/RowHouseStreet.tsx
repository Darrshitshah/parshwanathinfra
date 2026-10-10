/**
 * The row-house street (S6 mounts at data-slot="row-house-street"): the daytime elevation as a cinematic panorama
 * with seven mono callouts for the features in the image notes (white portal frame, recessed balcony bay, red
 * exposed-brick pillar, planters with creepers, car porch, two storeys, flat roof). Below lg the callouts become
 * numbered pins and the numbered legend carries the words; on phones the image can be dragged sideways so the pins
 * stay a usable size. Used on Home and on the project page (id="row-houses"). Owner: pages-lead.
 */
import { CalloutLegend } from "@/components/media/CalloutLegend";
import { Figure } from "@/components/media/Figure";
import { Eyebrow } from "@/components/ui/Section";
import { withTbd } from "@/components/ui/with-tbd";
import { rowHouseCallouts } from "@/content/copy/callouts";
import { homeCopy } from "@/content/copy/home";
import { getMedia } from "@/content/media";
import { shivShiva } from "@/content/projects";

interface RowHouseStreetProps {
  id?: string;
  index?: string;
}

export function RowHouseStreet({ id = "row-houses", index = "06" }: RowHouseStreetProps) {
  const street = getMedia("row-houses-day");
  const offering = shivShiva.offering.find((item) => item.typology === "rowhouses");
  const count = shivShiva.counts.rowHouses.toLocaleString("en-IN");

  return (
    <section id={id} data-slot="row-house-street" aria-labelledby={`${id}-title`} className="section-pad">
      <div className="wrap">
        <Eyebrow index={index}>{homeCopy.rowHouses.eyebrow}</Eyebrow>
        <div className="mt-10 grid gap-10 md:mt-14 lg:grid-cols-12 lg:gap-x-(--gutter)">
          <div className="lg:col-span-7">
            <h2 id={`${id}-title`} className="t-display-2 text-ink">
              {homeCopy.rowHouses.heading}
            </h2>
            <p className="t-lead mt-6 max-w-[40rem] text-ink-muted">{homeCopy.rowHouses.body}</p>
          </div>
          <div className="grid content-start gap-6 lg:col-span-4 lg:col-start-9">
            <dl className="m-0 border-t border-line-strong pt-4">
              <dt className="t-mono-sm text-ink-muted">{offering?.label ?? ""}</dt>
              <dd className="m-0 font-display text-[clamp(3rem,2rem+3.5vw,5rem)] leading-none text-ink [font-variant-numeric:lining-nums]">
                {count}
              </dd>
            </dl>
            <p className="t-small m-0 text-ink-muted">{withTbd(homeCopy.rowHouses.plotNote)}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 md:mt-16" data-fallback="static">
        <p className="t-mono-sm wrap m-0 mb-3 text-ink-muted md:hidden">{homeCopy.rowHouses.dragHint}</p>
        <div className="scroller" tabIndex={0} role="region" aria-label={homeCopy.rowHouses.regionLabel}>
          <div className="min-w-[46rem] md:min-w-0">
            <Figure
              media={street}
              sizes="(min-width: 768px) 100vw, 740px"
              callouts={rowHouseCallouts}
              caption={<span className="wrap block">{homeCopy.rowHouses.caption}</span>}
            />
          </div>
        </div>
      </div>

      <div className="wrap mt-12 lg:mt-16">
        <p className="t-mono-sm m-0 mb-4 text-ink-muted">{homeCopy.rowHouses.legendTitle}</p>
        <CalloutLegend items={rowHouseCallouts} label={homeCopy.rowHouses.legendTitle} className="md:grid-cols-2 md:gap-x-10 lg:grid-cols-3" />
      </div>
    </section>
  );
}
