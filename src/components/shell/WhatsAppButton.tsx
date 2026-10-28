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
      className="glass fixed right-4 z-(--z-whatsapp) inline-flex min-h-12 items-center gap-2.5 rounded-full px-4 text-ink transition-transform active:scale-95"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <Icon name="whatsapp" size={22} />
      <span className="t-mono-sm hidden sm:inline">{en.whatsapp.short}</span>
    </a>
  );
}
