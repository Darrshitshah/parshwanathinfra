/**
 * Overview: the unit counts as dimension lines, what is offered (with the typology colours) and the facts that
 * belong to the project: address, status, start year, possession, land area, approvals and price. Anything
 * unconfirmed is a TBD chip. Owner: pages-lead.
 */
import { Eyebrow } from "@/components/ui/Section";
import { Tbd } from "@/components/ui/Tbd";
import { TbdValue, rich } from "@/components/ui/with-tbd";
import { projectCopy } from "@/content/copy/project";
import type { Project } from "@/content/schema";
import { DimensionRows } from "@/components/home/DimensionRows";
import { FactsBlock } from "./FactsBlock";

const SWATCH: Record<string, string> = {
  flats: "var(--type-flats)",
  rowhouses: "var(--type-rowhouses)",
  shops: "var(--type-shops)",
};

export function Overview({ project }: { project: Project }) {
  const copy = projectCopy.overview;
  const labels = copy.labels;
  const approvals = project.approvals;

  return (
    <section id="overview" aria-labelledby="overview-title" className="section-pad">
      <div className="wrap">
        <Eyebrow index="01">{copy.eyebrow}</Eyebrow>
        <div className="mt-10 grid gap-14 md:mt-14 lg:grid-cols-12 lg:gap-x-(--gutter)">
          <div className="lg:col-span-5">
            <h2 id="overview-title" className="t-display-2 text-ink">
              {rich(copy.heading)}
            </h2>
            <p className="t-lead mt-6 max-w-[30rem] text-ink-muted">{rich(project.summary)}</p>

            <p className="t-mono-sm mb-4 mt-10 text-ink-muted">{copy.offeringLabel}</p>
            <ul className="m-0 grid list-none gap-0 border-t border-line-strong p-0">
              {project.offering.map((item) => (
                <li key={item.typology} className="flex items-center gap-3 border-b border-line py-3.5 text-ink">
                  <span aria-hidden="true" className="inline-block size-3 shrink-0 border border-line-strong" style={{ background: SWATCH[item.typology] }} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <DimensionRows label={copy.countsLabel} size="md" />
          </div>
        </div>

        <FactsBlock
          className="mt-14 md:mt-20"
          columns={4}
          label={copy.factsLabel}
          facts={[
            { label: labels.address, value: <address className="not-italic">{rich(project.location.address)}</address> },
            { label: labels.status, value: project.status },
            { label: labels.started, value: <TbdValue value={project.started}>{(year) => String(year)}</TbdValue> },
            { label: labels.possession, value: <TbdValue value={project.possession} /> },
            { label: labels.landArea, value: <TbdValue value={project.landArea} /> },
            {
              label: labels.approvals,
              value:
                approvals === "TBD" ? (
                  <Tbd />
                ) : (
                  <ul className="m-0 grid list-none gap-1 p-0">
                    {approvals.map((approval) => (
                      <li key={approval}>{approval}</li>
                    ))}
                  </ul>
                ),
            },
            { label: labels.price, value: project.price.display },
            { label: labels.developer, value: project.developer },
          ]}
        />
        <p className="t-small mt-4 text-ink-muted">{copy.indicativeNote}</p>
      </div>
    </section>
  );
}
