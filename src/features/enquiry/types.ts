/**
 * Types shared by the enquiry form, drawer and provider. Type-only: safe to import from client and server code.
 * Owner: pages-lead.
 */

/** Plain, serialisable facts the server hands to the client-side enquiry code (built by config.ts). */
export interface EnquiryConfig {
  /** Projects that can be enquired about. Only Shiv Shiva today. */
  projects: ReadonlyArray<{ slug: string; name: string }>;
  defaultProject: string;
  office: { name: string; address: string; mapUrl: string };
  /** Confirmed sales numbers only (10 digits). Empty while every number is TBD. */
  phones: ReadonlyArray<{ label: string; number: string }>;
  /** Confirmed WhatsApp number (10 digits) or null while TBD. */
  whatsapp: string | null;
}

/** Context an enquiry can be opened with (from the plan, the explorer or a CTA). */
export interface EnquiryPrefill {
  project?: string;
  /** One of the interest values, for example "2bhk-rowhouse". */
  interest?: string;
  /** Row-house plot number, 1 to 165. */
  plot?: number;
  /** A home or unit label from the building explorer. */
  unit?: string;
}

export interface EnquiryContextValue {
  /** Open the enquiry drawer, optionally pre-filled. */
  open: (prefill?: EnquiryPrefill) => void;
  close: () => void;
  isOpen: boolean;
  /** Warm the drawer chunk (call on hover or focus of a call to action). */
  prefetch: () => void;
}
