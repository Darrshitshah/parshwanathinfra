/**
 * The closing call to action: a big statement, the filled enquiry button (opens the drawer) and the site office.
 * Used on Home (id="visit") and on the project page (id="enquire"). Owner: pages-lead.
 */
import { EnquireButton } from "@/components/ui/EnquireButton";
import { Eyebrow } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import { rich } from "@/components/ui/with-tbd";
import { homeCopy } from "@/content/copy/home";
import { en } from "@/content/i18n/en";
import { site } from "@/content/site";

interface EnquiryCtaProps {
  id?: string;
  index?: string;
}

export function EnquiryCta({ id = "visit", index = "09" }: EnquiryCtaProps) {
  const office = site.contact.office;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="section-pad border-t border-line bg-grid">
      <div className="wrap">
        <Eyebrow index={index}>{homeCopy.visit.eyebrow}</Eyebrow>
        <h2 id={`${id}-title`} className="t-display-2 mt-10 max-w-[16ch] text-ink md:mt-14">
          {homeCopy.visit.heading}
        </h2>
        <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-12 lg:items-end lg:gap-x-(--gutter)">
          <div className="lg:col-span-6">
            <p className="t-lead m-0 max-w-[30rem] text-ink-muted">{homeCopy.visit.body}</p>
            <div className="mt-8">
              <EnquireButton size="lg">{homeCopy.visit.cta}</EnquireButton>
            </div>
          </div>
          <div className="grid gap-1.5 border-t border-line-strong pt-4 lg:col-span-4 lg:col-start-9">
            <p className="t-mono-sm m-0 text-ink-muted">{homeCopy.visit.officeLabel}</p>
            <address className="m-0 text-ink not-italic">{rich(office.address)}</address>
            <p className="mt-2">
              <TextLink href={office.mapUrl} className="t-small">
                {en.common.openInMaps}
              </TextLink>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
