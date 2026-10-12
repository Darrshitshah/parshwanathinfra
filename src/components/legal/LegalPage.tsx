/**
 * Shared layout for the legal pages (privacy, terms, disclaimer). Each carries a visible "Draft for review by
 * Parshwanath Infra" banner and a "last reviewed" line that stays TBD. Unknowns in the text are TBD chips. A contents
 * list sits beside the text from the lg breakpoint. Owner: pages-lead.
 */
import { Eyebrow } from "@/components/ui/Section";
import { Tbd } from "@/components/ui/Tbd";
import { withTbd } from "@/components/ui/with-tbd";
import type { LegalDoc } from "@/content/copy/legal";
import { en } from "@/content/i18n/en";

function sectionId(index: number): string {
  return `section-${index + 1}`;
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <section aria-labelledby="legal-title" className="border-b border-line bg-grid">
        <div className="wrap pb-12 pt-10 md:pb-16 md:pt-16">
          <Eyebrow index="01">{en.footer.legalLabel}</Eyebrow>
          <h1 id="legal-title" className="t-display-1 mt-8 text-[clamp(3.5rem,1rem+20vw,9rem)] text-ink md:mt-12 md:text-[clamp(6rem,11vw,11rem)]">
            {doc.title}
          </h1>
          <p className="t-lead mt-6 max-w-[34rem] text-ink-muted">{doc.intro}</p>
          <div className="mt-8 max-w-[34rem] border border-dashed border-line-strong bg-paper-raised p-4" data-draft-banner="">
            <p className="t-mono m-0 text-ink">{en.legal.draftBanner}</p>
            <p className="t-small mb-0 mt-2 text-ink-muted">{en.legal.draftNote}</p>
            <p className="t-mono-sm mb-0 mt-3 flex flex-wrap items-center gap-2 text-ink-muted">
              <span>{en.legal.lastReviewed}:</span>
              <Tbd />
            </p>
          </div>
        </div>
      </section>

      <div className="wrap section-pad grid gap-12 pt-14 lg:grid-cols-12 lg:gap-x-(--gutter) md:pt-20">
        <nav aria-label={doc.title} className="hidden lg:col-span-3 lg:block">
          <ol className="sticky top-[calc(var(--header-h)+2rem)] m-0 grid list-none gap-1 p-0">
            {doc.sections.map((section, index) => (
              <li key={section.heading}>
                <a href={`#${sectionId(index)}`} className="link-draw link-draw--quiet inline-flex min-h-9 items-baseline gap-3 text-[0.9375rem] text-ink">
                  <span className="t-mono-sm text-ink-muted">{String(index + 1).padStart(2, "0")}</span>
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid gap-0 lg:col-span-8 lg:col-start-5">
          {doc.sections.map((section, index) => (
            <section
              key={section.heading}
              id={sectionId(index)}
              aria-labelledby={`${sectionId(index)}-title`}
              className="grid gap-4 border-t border-line-strong py-8 first:border-t-0 first:pt-0 md:grid-cols-[3rem_1fr] md:gap-6"
            >
              <span className="t-mono-sm pt-2 text-ink-muted" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 id={`${sectionId(index)}-title`} className="t-display-4 m-0 text-ink">
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mb-0 mt-4 max-w-[40rem] text-ink-muted">
                    {withTbd(paragraph)}
                  </p>
                ))}
                {section.list ? (
                  <ul className="mb-0 mt-4 grid max-w-[40rem] list-disc gap-2 pl-5 text-ink-muted marker:text-ink-faint">
                    {section.list.map((item) => (
                      <li key={item}>{withTbd(item)}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
