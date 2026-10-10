/** Small formatting helpers for the enquiry UI. Pure, no React. Owner: pages-lead. */
import { parseIsoDate } from "./schema";

/** "2026-10-18" becomes "Sunday, 18 October 2026". Returns "" for an empty or invalid date. */
export function formatVisitDate(iso: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) return "";
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** First word of a name, for a friendly greeting. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

/** wa.me link for a confirmed ten-digit WhatsApp number. */
export function whatsappLink(tenDigits: string, text?: string): string {
  const base = `https://wa.me/91${tenDigits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
