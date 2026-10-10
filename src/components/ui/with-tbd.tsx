/**
 * Turn the standalone word "TBD" inside a string into a visible TBD chip. Page copy and legal text mark unknowns
 * with the token, so a gap can never read as a fact.
 */
import { Fragment, type ReactNode } from "react";
import { Tbd, TBD_TOKEN } from "./Tbd";

const TOKEN_PATTERN = /\b(TBD)\b/;

export function withTbd(text: string): ReactNode {
  const parts = text.split(TOKEN_PATTERN);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    part === TBD_TOKEN ? <Tbd key={`tbd-${index}`} /> : <Fragment key={`text-${index}`}>{part}</Fragment>,
  );
}

/** Phrases that must never break across lines, wherever they appear (a hyphen is a line-break opportunity). */
const NOWRAP_PHRASES = ["Vapi-Silvassa Road"] as const;

const RICH_PATTERN = new RegExp(
  `(\\*[^*]+\\*|~[^~]+~|\\bTBD\\b|${NOWRAP_PHRASES.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
);

/**
 * Page copy with light markup: the word TBD becomes a chip, *starred words* become italic emphasis (in the display
 * serif's italic) and ~tilde words~ never break across lines. "Vapi-Silvassa Road" never breaks at its hyphen, wherever
 * it appears (also in content strings). Used for headings, statements and any text that may carry these phrases.
 */
export function rich(text: string): ReactNode {
  const parts = text.split(RICH_PATTERN);
  if (parts.length === 1) return text;
  return parts.map((part, index) => {
    if (part === TBD_TOKEN) return <Tbd key={`tbd-${index}`} />;
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={`em-${index}`} className="text-brick-ink">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.length > 2 && part.startsWith("~") && part.endsWith("~")) {
      return (
        <span key={`nb-${index}`} className="whitespace-nowrap">
          {part.slice(1, -1)}
        </span>
      );
    }
    if ((NOWRAP_PHRASES as readonly string[]).includes(part)) {
      return (
        <span key={`nb-${index}`} className="whitespace-nowrap">
          {part}
        </span>
      );
    }
    return <Fragment key={`text-${index}`}>{part}</Fragment>;
  });
}

/** Show the chip for the literal "TBD", otherwise the confirmed value (or a formatted version of it). */
export function TbdValue<T extends string | number | undefined>({
  value,
  children,
}: {
  value: T | typeof TBD_TOKEN;
  children?: (confirmed: Exclude<T, undefined>) => ReactNode;
}) {
  if (value === TBD_TOKEN || value === undefined) return <Tbd />;
  const confirmed = value as Exclude<T, undefined>;
  return <>{children ? children(confirmed) : confirmed}</>;
}
