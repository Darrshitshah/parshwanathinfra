/** Plain props the server shell hands to the client header and menu. Type-only. Owner: pages-lead. */

export interface ShellNavItem {
  href: string;
  label: string;
}

export interface ShellLabels {
  wordmark: string;
  homeLink: string;
  primary: string;
  menu: string;
  openMenu: string;
  closeMenu: string;
  enquire: string;
  themeToggle: string;
  themeGroup: string;
}

export interface ShellOffice {
  heading: string;
  address: string;
  mapUrl: string;
  mapLabel: string;
}
