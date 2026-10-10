/**
 * Site footer, laid out like the title block of a drawing: company and tagline, navigation, legal links, the site
 * office with a map link and the sales numbers, the legal name and project facts (TBD chips while unconfirmed), the
 * disclaimers and the copyright line. The RERA line and the RERA disclaimer appear only when SHOW_RERA is on
 * (src/content/copy/flags.ts; off by Darshit's decision). Owner: pages-lead.
 */
import Link from "next/link";
import type { CSSProperties } from "react";
import { SHOW_RERA } from "@/content/copy/flags";
import { en } from "@/content/i18n/en";
import { isTbd } from "@/content/schema";
import { shivShiva } from "@/content/projects";
import { site } from "@/content/site";
import { TextLink } from "@/components/ui/TextLink";
import { formatPhone } from "@/features/enquiry/phone";
import { TbdValue, rich } from "@/components/ui/with-tbd";
import { LEGAL_ITEMS, NAV_ITEMS } from "./nav";

// Evaluated once when the site is built.
const BUILD_YEAR = new Date().getFullYear();
// The legal name already ends in a full stop ("Pvt. Ltd."), so do not add a second one.
const COPYRIGHT_NAME = (isTbd(site.legalName) ? site.name : site.legalName).replace(/\.$/, "");

function FooterNav({ label, items }: { label: string; items: ReadonlyArray<{ href: string; label: string }> }) {
  return (
    <nav aria-label={label}>
      <p className="t-mono-sm mb-4 mt-0 text-ink-muted">{label}</p>
      <ul className="m-0 grid list-none gap-1 p-0">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="link-draw link-draw--quiet inline-flex min-h-9 items-center text-[0.9375rem] text-ink">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  const office = site.contact.office;
  const reraUrl = site.rera.url;
  return (
    <footer className="mt-(--section-space) border-t border-line-strong bg-paper-sunk" data-site-footer="">
      <div className="rule-ticks" aria-hidden="true" />
      <div className="wrap py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-(--gutter)">
          <div className="lg:col-span-5">
            <p className="t-display-3 m-0 text-ink">{site.name}</p>
            <p className="t-lead mt-4 max-w-[26rem] text-ink-muted">{site.tagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-[1fr_1fr_1.6fr]">
            <FooterNav label={en.footer.navLabel} items={NAV_ITEMS} />
            <FooterNav label={en.footer.legalLabel} items={LEGAL_ITEMS} />
            <div className="col-span-2 sm:col-span-1">
              <p className="t-mono-sm mb-4 mt-0 text-ink-muted">{en.footer.office}</p>
              <address className="t-small m-0 text-ink not-italic">{rich(office.address)}</address>
              <p className="mt-3">
                <TextLink href={office.mapUrl} className="t-small">
                  {en.common.openInMaps}
                </TextLink>
              </p>
              <ul className="mt-5 grid list-none gap-1 p-0" data-footer-phones="">
                {site.contact.phones.map((phone) => (
                  <li key={phone.number} className="t-small flex flex-wrap items-baseline gap-x-2 text-ink">
                    <span className="text-ink-muted">{phone.label}:</span>
                    <TbdValue value={phone.number}>
                      {(number) => (
                        <TextLink href={`tel:+91${number}`} className="t-small">
                          {formatPhone(number)}
                        </TextLink>
                      )}
                    </TbdValue>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <dl className="titleblock mt-14" style={{ "--tb-cols": 4 } as CSSProperties}>
          <div className="titleblock__cell">
            <dt className="titleblock__label">{en.footer.developer}</dt>
            <dd className="titleblock__value m-0">{site.name}</dd>
          </div>
          <div className="titleblock__cell">
            <dt className="titleblock__label">{en.legal.legalName}</dt>
            <dd className="titleblock__value m-0">
              <TbdValue value={site.legalName} />
            </dd>
          </div>
          <div className="titleblock__cell">
            <dt className="titleblock__label">{en.footer.project}</dt>
            <dd className="titleblock__value m-0">{shivShiva.name}</dd>
          </div>
          <div className="titleblock__cell">
            <dt className="titleblock__label">{en.footer.status}</dt>
            <dd className="titleblock__value m-0">{shivShiva.status}</dd>
          </div>
        </dl>

        {SHOW_RERA ? (
        <p className="t-mono mb-0 mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-ink" data-rera-line="">
          <span>{en.legal.reraLabel}:</span>
          <TbdValue value={site.rera.number}>
            {(number) =>
              reraUrl === "TBD" ? (
                <span>{number}</span>
              ) : (
                <TextLink href={reraUrl} className="t-mono">
                  {number}
                </TextLink>
              )
            }
          </TbdValue>
          <span aria-hidden="true">·</span>
          <span>{en.legal.reraAuthority}:</span>
          <TbdValue value={site.rera.authority} />
        </p>
        ) : null}

        <div className="mt-8 grid gap-4 border-t border-line pt-8 md:grid-cols-2 md:gap-x-10">
          {SHOW_RERA ? <p className="t-small m-0 text-ink-muted">{site.disclaimers.rera}</p> : null}
          <p className="t-small m-0 text-ink-muted">{site.disclaimers.artistImpression}</p>
          <p className="t-small m-0 text-ink-muted">{site.disclaimers.general}</p>
        </div>

        <div className="t-mono-sm mt-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-line pt-6 text-ink-muted">
          <p className="m-0">
            © {BUILD_YEAR} {COPYRIGHT_NAME}. {en.legal.rights}
          </p>
          <p className="m-0">{en.footer.sheetNote}</p>
        </div>
      </div>
    </footer>
  );
}
