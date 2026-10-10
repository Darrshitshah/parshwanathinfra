/**
 * Floating WhatsApp button. Rendered ONLY when site.contact.whatsapp holds a confirmed number: while it is TBD
 * nothing renders, rather than linking a guess. Outlined, never filled (the enquiry call to action is the only
 * filled button). Owner: pages-lead.
 */
import { en } from "@/content/i18n/en";
import { isTbd } from "@/content/schema";
import { site } from "@/content/site";
import { whatsappLink } from "@/features/enquiry/format";
import { Icon } from "@/components/ui/Icon";

export function WhatsAppButton({ number = site.contact.whatsapp }: { number?: string }) {
  if (isTbd(number)) return null;
  return (
    <a
      href={whatsappLink(number, en.whatsapp.prefill)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${en.whatsapp.label} (${en.common.opensInNewTab})`}
      data-whatsapp=""
      className="fixed right-4 z-(--z-whatsapp) inline-flex min-h-12 items-center gap-2.5 border border-line-strong bg-paper px-4 text-ink shadow-[0_2px_14px_rgb(0_0_0/0.12)] transition-colors hover:border-ink"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <Icon name="whatsapp" size={22} />
      <span className="t-mono-sm hidden sm:inline">{en.whatsapp.short}</span>
    </a>
  );
}
