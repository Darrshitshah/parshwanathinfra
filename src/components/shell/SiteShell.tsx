/**
 * Site chrome mounted by src/app/layout.tsx (Director).
 * Owner: pages-lead. Placeholder until Phase 1: skip link, header and nav, <main id="main">, footer with the
 * RERA line, enquiry drawer, floating WhatsApp button. Keep the export name and props.
 */
import type { ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return <main id="main">{children}</main>;
}
