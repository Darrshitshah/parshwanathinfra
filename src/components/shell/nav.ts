/** Primary navigation: paths here, labels in src/content/i18n/en.ts. Owner: pages-lead. */
import { en } from "@/content/i18n/en";

export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: en.nav.home },
  { href: "/projects", label: en.nav.projects },
  { href: "/about", label: en.nav.about },
  { href: "/contact", label: en.nav.contact },
];

export const LEGAL_ITEMS: readonly NavItem[] = [
  { href: "/privacy", label: en.legal.privacy },
  { href: "/terms", label: en.legal.terms },
  { href: "/disclaimer", label: en.legal.disclaimer },
];
