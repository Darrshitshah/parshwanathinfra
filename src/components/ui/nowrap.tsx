/**
 * Keeps named phrases from breaking across lines (a hyphen is a line-break opportunity, so "Vapi-Silvassa Road"
 * would otherwise split after "Vapi-"). Tiny and dependency free, so client components can use it without pulling in
 * the string tables. Use it for running text and addresses, not for display headings, where a phrase wider than its
 * column would overflow. Owner: pages-lead.
 */
import { Fragment, type ReactNode } from "react";

export const NOWRAP_PHRASES = ["Vapi-Silvassa Road"] as const;

/** The phrases as a regular-expression alternation (special characters escaped), for building larger patterns. */
export const NOWRAP_SOURCE = NOWRAP_PHRASES.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
export const NOWRAP_PATTERN = new RegExp(`(${NOWRAP_SOURCE})`);

export function isNowrapPhrase(part: string): boolean {
  return (NOWRAP_PHRASES as readonly string[]).includes(part);
}

export function keepTogether(text: string): ReactNode {
  const parts = text.split(NOWRAP_PATTERN);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    isNowrapPhrase(part) ? (
      <span key={`nb-${index}`} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      <Fragment key={`text-${index}`}>{part}</Fragment>
    ),
  );
}
