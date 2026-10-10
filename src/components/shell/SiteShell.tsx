/**
 * Site chrome mounted by src/app/layout.tsx (Director). Owner: pages-lead.
 *
 * Skip link, header and navigation (with the mobile menu), <main id="main">, the footer with the legal name, the
 * RERA line and the disclaimers, the floating WhatsApp button (only once a number is confirmed) and the enquiry
 * drawer, mounted once through EnquiryProvider. Everything except [data-app-root] is a portal or the provider, so
 * dialogs can make the page inert without touching themselves. Keep the export name and props.
 */
import type { ReactNode } from "react";
import { en } from "@/content/i18n/en";
import { site } from "@/content/site";
import { EnquiryProvider } from "@/features/enquiry/EnquiryProvider";
import { buildEnquiryConfig } from "@/features/enquiry/config";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { WhatsAppButton } from "./WhatsAppButton";
import { NAV_ITEMS } from "./nav";
import type { ShellLabels, ShellOffice } from "./shell-types";

const LABELS: ShellLabels = {
  wordmark: site.name,
  homeLink: en.nav.homeLink,
  primary: en.nav.primaryLabel,
  menu: en.nav.menu,
  openMenu: en.nav.openMenu,
  closeMenu: en.nav.closeMenu,
  enquire: en.nav.enquire,
  themeToggle: en.nav.themeToggle,
  themeGroup: en.nav.themeGroup,
};

const OFFICE: ShellOffice = {
  heading: en.footer.office,
  address: site.contact.office.address,
  mapUrl: site.contact.office.mapUrl,
  mapLabel: en.common.openInMaps,
};

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <EnquiryProvider config={buildEnquiryConfig()}>
      <div data-app-root="" className="flex min-h-dvh flex-col">
        <a href="#main" className="skip-link">
          {en.nav.skipToContent}
        </a>
        <SiteHeader nav={NAV_ITEMS} labels={LABELS} office={OFFICE} />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SiteFooter />
        <WhatsAppButton />
      </div>
    </EnquiryProvider>
  );
}
