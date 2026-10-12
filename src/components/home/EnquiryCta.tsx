/**
 * The closing call to action on a deep-maroon colour block: a big statement with one script word, the round enquiry
 * disc (opens the drawer) and the site office. Used on Home (id="visit") and on the project page (id="enquire").
 * Owner: pages-lead.
 */
import { Magnetic } from "@/components/cursor";
import { EnquireButton } from "@/components/ui/EnquireButton";
import { Eyebrow } from "@/components/ui/Section";
import { Seal } from "@/components/ui/Seal";
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
    <section id={id} aria-labelledby={`${id}-title`} className="tone-jewel sheet overflow-hidden">
      <div className="wrap relative">
        <Eyebrow index={index}>{homeCopy.visit.eyebrow}</Eyebrow>
        <h2 id={`${id}-title`} className="t-display-2 mt-10 max-w-[15ch] text-ink md:mt-14 md:text-[clamp(3rem,1rem+6.2vw,7.5rem)]">
          {rich(homeCopy.visit.heading, { keepPhrases: false })}
        </h2>
        <div className="mt-14 grid gap-12 md:mt-20 lg:grid-cols-12 lg:items-end lg:gap-x-(--gutter)">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-8 lg:col-span-7">
            <Magnetic>
              <EnquireButton size="lg">{homeCopy.visit.cta}</EnquireButton>
            </Magnetic>
            <p className="t-lead m-0 max-w-[24rem] text-ink-muted">{homeCopy.visit.body}</p>
          </div>
          <div className="grid gap-1.5 lg:col-span-4 lg:col-start-9">
            <p className="t-mono-sm m-0 text-ink-muted">{homeCopy.visit.officeLabel}</p>
            <address className="m-0 text-ink not-italic">{rich(office.address)}</address>
            <p className="mt-2">
              <TextLink href={office.mapUrl} className="t-small">
                {en.common.openInMaps}
              </TextLink>
            </p>
          </div>
        </div>
        <Seal size={176} spin className="pointer-events-none absolute -top-6 right-(--gutter) hidden text-ink opacity-25 lg:block" />
      </div>
    </section>
  );
}
