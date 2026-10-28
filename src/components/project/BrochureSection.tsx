/**
 * Brochure, price and registration. The brochure button is visible but disabled and reads "Brochure: TBD" while no
 * brochure PDF exists. The price reads "Price on request" until a price is confirmed. The approvals follow, then the
 * disclaimers. The RERA line, its authority and the RERA disclaimer appear only when SHOW_RERA is on (flags.ts).
 * Owner: pages-lead.
 */
import { LineButton } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Section";
import { Tbd } from "@/components/ui/Tbd";
import { TbdValue, rich } from "@/components/ui/with-tbd";
import { TextLink } from "@/components/ui/TextLink";
import { SHOW_RERA } from "@/content/copy/flags";
import { projectCopy } from "@/content/copy/project";
import { en } from "@/content/i18n/en";
import type { Project } from "@/content/schema";
import { site } from "@/content/site";
import { FactsBlock } from "./FactsBlock";

export function BrochureSection({ project }: { project: Project }) {
  const copy = projectCopy.brochure;
  const brochureReady = project.brochure !== "TBD";
  const approvals = project.approvals;

  return (
    <section id="brochure" aria-labelledby="brochure-title" className="tone-paper sheet">
      <div className="wrap">
        <Eyebrow index="08">{copy.eyebrow}</Eyebrow>
        <h2 id="brochure-title" className="t-display-2 mt-10 max-w-[18ch] text-ink md:mt-14">
          {rich(copy.heading)}
        </h2>

        <div className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-12 lg:gap-x-(--gutter)">
          <div className="grid content-start gap-10 lg:col-span-5">
            <div className="rounded-(--radius-card) bg-paper-raised p-7">
              <h3 className="t-mono-sm m-0 text-ink-muted">{copy.brochureTitle}</h3>
              <div className="mt-4">
                {brochureReady ? (
                  <TextLink href={project.brochure}>{copy.brochureButton}</TextLink>
                ) : (
                  <LineButton disabled aria-disabled="true" title={en.common.tbdTitle} data-brochure="">
                    {copy.brochureButton}: <Tbd />
                  </LineButton>
                )}
              </div>
              <p className="t-small mb-0 mt-4 max-w-[26rem] text-ink-muted">{copy.brochureNote}</p>
            </div>

            <div className="rounded-(--radius-card) bg-paper-raised p-7">
              <h3 className="t-mono-sm m-0 text-ink-muted">{copy.priceTitle}</h3>
              <p className="mb-0 mt-3 font-display text-[clamp(2rem,1.5rem+1.6vw,3rem)] font-medium uppercase leading-none text-ink">{project.price.display}</p>
              <p className="t-small mb-0 mt-4 max-w-[26rem] text-ink-muted">{project.price.note ?? copy.priceNote}</p>
            </div>
          </div>

          <div className="grid content-start gap-8 lg:col-span-7">
            <div>
              <h3 className="t-mono-sm m-0 mb-4 text-ink-muted">{SHOW_RERA ? copy.reraTitle : copy.approvalsTitle}</h3>
              {SHOW_RERA ? (
                <p className="t-mono m-0 mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-ink" data-rera-line="">
                  <span>{en.legal.reraLabel}:</span>
                  <TbdValue value={project.rera.number} />
                </p>
              ) : null}
              <FactsBlock
                columns={2}
                facts={[
                  ...(SHOW_RERA ? [{ label: en.legal.reraAuthority, value: <TbdValue value={project.rera.authority} /> }] : []),
                  {
                    label: projectCopy.overview.labels.approvals,
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
                ]}
              />
            </div>

            <div>
              <h3 className="t-mono-sm m-0 mb-4 text-ink-muted">{copy.disclaimersTitle}</h3>
              <div className="grid gap-3">
                {SHOW_RERA ? <p className="t-small m-0 text-ink-muted">{site.disclaimers.rera}</p> : null}
                <p className="t-small m-0 text-ink-muted">{site.disclaimers.artistImpression}</p>
                <p className="t-small m-0 text-ink-muted">{site.disclaimers.general}</p>
              </div>
              <p className="t-small mt-4">
                <TextLink href="/disclaimer">{en.legal.disclaimer}</TextLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
