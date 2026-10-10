/**
 * The word that slides through the curtain. Owner: motion-lead.
 *
 * Priority: an explicit `data-transition-title` on the link, else a title derived from the destination path.
 * Link text is never used: "Learn more" or an icon says nothing about where you are going.
 */

export const ROOT_TITLE = "Parshwanath Infra";
const MAX_TITLE_LENGTH = 60;
const ACRONYMS = new Set(["rera", "faq", "nri", "bhk", "emi", "gst"]);

function titleCase(word: string): string {
  if (ACRONYMS.has(word.toLowerCase())) return word.toUpperCase();
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** "/" is the company name; "/projects/shiv-shiva" is "Shiv Shiva"; "/legal/rera-disclaimer" is "RERA Disclaimer". */
export function titleFromPath(pathname: string): string {
  const last = pathname.split("/").filter(Boolean).at(-1);
  if (!last) return ROOT_TITLE;
  let decoded = last;
  try {
    decoded = decodeURIComponent(last);
  } catch {
    // keep the raw segment
  }
  const words = decoded
    .replace(/\.[a-z0-9]+$/i, "")
    .split(/[-_\s]+/)
    .filter(Boolean);
  return words.length > 0 ? words.map(titleCase).join(" ") : ROOT_TITLE;
}

export function resolveTransitionTitle(anchor: { getAttribute(name: string): string | null }, url: URL): string {
  const explicit = anchor.getAttribute("data-transition-title")?.replace(/\s+/g, " ").trim();
  if (explicit) return explicit.slice(0, MAX_TITLE_LENGTH);
  return titleFromPath(url.pathname);
}
