/**
 * Contact / site visit. Owner: pages-lead. Split layout: the enquiry form inline on one side; the site office, the
 * schematic map and the directions link on the other. Phone numbers, WhatsApp, email and hours are TBD chips until
 * confirmed (docs/QUESTIONS.md). The form posts to /api/enquiry and says so honestly if delivery is not switched on.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LocationMap } from "@/components/home/LocationMap";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/components/seo/page-metadata";
import { Eyebrow } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import { TbdValue, rich } from "@/components/ui/with-tbd";
import { directionsUrl } from "@/components/ui/map-links";
import { contactCopy } from "@/content/copy/contact";
import { en } from "@/content/i18n/en";
import { site } from "@/content/site";
import { buildEnquiryConfig } from "@/features/enquiry/config";
import { EnquiryForm } from "@/features/enquiry/EnquiryForm";
import { formatPhone } from "@/features/enquiry/phone";

export const metadata: Metadata = pageMetadata({
  title: contactCopy.metaTitle,
  description: contactCopy.metaDescription,
  path: "/contact",
});

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-4 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="t-mono-sm text-ink-muted">{label}</dt>
      <dd className="m-0 text-ink">{children}</dd>
    </div>
  );
}

export default function ContactPage() {
  const config = buildEnquiryConfig();
  const office = site.contact.office;
  const details = contactCopy.details;

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <section aria-labelledby="contact-title" className="border-b border-line bg-grid">
        <div className="wrap pb-14 pt-10 md:pb-20 md:pt-16">
          <Eyebrow index="01">{contactCopy.eyebrow}</Eyebrow>
          <h1 id="contact-title" className="t-display-1 mt-8 text-ink md:mt-12 md:text-[clamp(7rem,13vw,13rem)]">
            {contactCopy.title}
          </h1>
          <p className="t-lead mt-6 max-w-[30rem] text-ink-muted">{contactCopy.intro}</p>
        </div>
      </section>

      <section aria-labelledby="enquiry-title" className="section-pad pt-14 md:pt-20">
        <div className="wrap grid gap-16 lg:grid-cols-12 lg:gap-x-(--gutter)">
          <div className="lg:col-span-7">
            <Eyebrow index="02">{contactCopy.formEyebrow}</Eyebrow>
            <h2 id="enquiry-title" className="t-display-3 mt-8 text-ink">
              {en.enquiry.title}
            </h2>
            <p className="mb-10 mt-3 max-w-[34rem] text-ink-muted">{en.enquiry.intro}</p>
            <EnquiryForm config={config} scope="contact" variant="inline" />
          </div>

          <aside aria-labelledby="office-title" className="lg:col-span-5">
            <Eyebrow index="03">{details.eyebrow}</Eyebrow>
            <h2 id="office-title" className="t-display-3 mt-8 text-ink">
              {office.name}
            </h2>

            <dl className="m-0 mt-8 border-t border-line-strong">
              <DetailRow label={details.address}>
                <address className="not-italic">{rich(office.address)}</address>
              </DetailRow>
              {site.contact.phones.map((phone) => (
                <DetailRow key={phone.number} label={`${details.phone}: ${phone.label}`}>
                  <TbdValue value={phone.number}>
                    {(number) => <TextLink href={`tel:+91${number}`}>{formatPhone(number)}</TextLink>}
                  </TbdValue>
                </DetailRow>
              ))}
              <DetailRow label={details.whatsapp}>
                <TbdValue value={site.contact.whatsapp}>
                  {(number) => <TextLink href={`https://wa.me/91${number}`}>{formatPhone(number)}</TextLink>}
                </TbdValue>
              </DetailRow>
              <DetailRow label={details.email}>
                <TbdValue value={site.contact.email}>
                  {(email) => <TextLink href={`mailto:${email}`}>{email}</TextLink>}
                </TbdValue>
              </DetailRow>
              <DetailRow label={details.hours}>
                <TbdValue value={site.contact.officeHours} />
              </DetailRow>
            </dl>

            <p className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
              <TextLink href={office.mapUrl}>{en.common.openInMaps}</TextLink>
              <TextLink href={directionsUrl(office.geo)}>{en.common.getDirections}</TextLink>
            </p>
            <p className="t-small mt-3 max-w-[26rem] text-ink-muted">{contactCopy.directionsNote}</p>

            <div className="mt-10">
              <LocationMap />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
