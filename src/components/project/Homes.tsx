/**
 * Homes: what is offered, with two slots the Phase 2 leads fill.
 *  - data-slot="units": the unit-type floor plans (data-lead's units). Static fallback: one column per typology with
 *    the offering and the count, and area and floor plan as TBD chips until confirmed.
 *  - data-slot="explorer": the building explorer (plan-lead's S5). Static fallback: the availability legend and a
 *    residential render, with floors per building as a TBD chip.
 * Owner: pages-lead.
 */
import { Figure } from "@/components/media/Figure";
import { Eyebrow } from "@/components/ui/Section";
import { Tbd } from "@/components/ui/Tbd";
import { rich } from "@/components/ui/with-tbd";
import { projectCopy } from "@/content/copy/project";
import { en } from "@/content/i18n/en";
import { getMedia } from "@/content/media";
import type { Project } from "@/content/schema";

const TYPOLOGY_COLOUR: Record<string, string> = {
  flats: "var(--type-flats)",
  rowhouses: "var(--type-rowhouses)",
  shops: "var(--type-shops)",
};

const STATUS_COLOUR: Record<string, string> = {
  available: "var(--status-available)",
  booked: "var(--status-booked)",
  sold: "var(--status-sold)",
  tbd: "var(--status-tbd)",
};

function countFor(project: Project, typology: string): number {
  if (typology === "flats") return project.counts.flats;
  if (typology === "rowhouses") return project.counts.rowHouses;
  return project.counts.shops;
}

export function Homes({ project }: { project: Project }) {
  const copy = projectCopy.homes;
  const towers = getMedia("towers-courtyard");

  return (
    <section id="homes" aria-labelledby="homes-title" className="section-pad border-y border-line bg-paper-sunk">
      <div className="wrap">
        <Eyebrow index="03">{copy.eyebrow}</Eyebrow>
        <div className="mt-10 grid gap-8 md:mt-14 lg:grid-cols-12 lg:gap-x-(--gutter)">
          <h2 id="homes-title" className="t-display-2 text-ink lg:col-span-6">
            {copy.heading}
          </h2>
          <p className="t-lead m-0 text-ink-muted lg:col-span-5 lg:col-start-8">{rich(copy.body)}</p>
        </div>

        <div data-slot="units" data-fallback="static" className="mt-14 md:mt-20">
          <h3 className="t-mono-sm m-0 mb-4 text-ink-muted">{copy.units.title}</h3>
          <ul className="m-0 grid list-none gap-px border border-line-strong bg-line-strong p-0 md:grid-cols-3">
            {project.offering.map((item) => (
              <li key={item.typology} data-unit-type={item.typology} className="bg-paper-raised p-5 md:p-6">
                <span aria-hidden="true" className="mb-4 block h-1 w-10" style={{ background: TYPOLOGY_COLOUR[item.typology] }} />
                <h4 className="t-display-4 m-0 text-ink">{en.typology[item.typology]}</h4>
                <dl className="m-0 mt-5 grid gap-4">
                  <div>
                    <dt className="titleblock__label">{copy.units.offering}</dt>
                    <dd className="m-0 text-ink">{item.label}</dd>
                  </div>
                  <div>
                    <dt className="titleblock__label">{copy.units.count}</dt>
                    <dd className="m-0 font-display text-[2.25rem] leading-none text-ink [font-variant-numeric:lining-nums]">
                      {countFor(project, item.typology).toLocaleString("en-IN")}
                    </dd>
                  </div>
                  <div>
                    <dt className="titleblock__label">{copy.units.area}</dt>
                    <dd className="m-0">
                      <Tbd />
                    </dd>
                  </div>
                  <div>
                    <dt className="titleblock__label">{copy.units.plan}</dt>
                    <dd className="m-0">
                      <Tbd />
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <p className="t-small mt-4 max-w-[40rem] text-ink-muted">{copy.units.note}</p>
        </div>

        <div data-slot="explorer" data-fallback="static" className="mt-14 grid gap-10 md:mt-20 lg:grid-cols-12 lg:gap-x-(--gutter)">
          <div className="lg:col-span-5">
            <h3 className="t-mono-sm m-0 mb-4 text-ink-muted">{copy.explorer.title}</h3>
            <p className="t-lead m-0 text-ink">{rich(copy.explorer.note)}</p>
            <p className="t-mono-sm mb-3 mt-8 text-ink-muted">{copy.explorer.legendTitle}</p>
            <ul className="m-0 grid list-none gap-0 border-t border-line-strong p-0">
              {copy.explorer.legend.map((status) => (
                <li key={status.id} className="flex items-center gap-3 border-b border-line py-3 text-ink">
                  <span aria-hidden="true" className="inline-block size-3 shrink-0" style={{ background: STATUS_COLOUR[status.id] }} />
                  {rich(status.label)}
                </li>
              ))}
            </ul>
            <p className="t-small mt-4 text-ink-muted">{en.common.availabilityOnRequest}.</p>
          </div>
          <div className="lg:col-span-7">
            <Figure
              media={towers}
              sizes="(min-width: 1408px) 760px, (min-width: 1024px) 56vw, calc(100vw - 2rem)"
              aspect={null}
              frameClassName="aspect-[4/3] lg:aspect-[3/2]"
              marks
              caption={copy.explorer.caption}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
