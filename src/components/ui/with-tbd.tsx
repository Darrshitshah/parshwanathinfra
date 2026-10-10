/**
 * Turn the standalone word "TBD" inside a string into a visible TBD chip. Page copy and legal text mark unknowns
 * with the token, so a gap can never read as a fact.
 */
import { Fragment, type ReactNode } from "react";
import { Tbd, TBD_TOKEN } from "./Tbd";
import { isNowrapPhrase, NOWRAP_SOURCE } from "./nowrap";

const TOKEN_PATTERN = /\b(TBD)\b/;

export function withTbd(text: string): ReactNode {
  const parts = text.split(TOKEN_PATTERN);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    part === TBD_TOKEN ? <Tbd key={`tbd-${index}`} /> : <Fragment key={`text-${index}`}>{part}</Fragment>,
  );
}

/** The markup tokens, and the same with the protected phrases added (both capture, so split keeps the separators). */
const MARKUP = String.raw`\*[^*]+\*|~[^~]+~|\bTBD\b`;
const MARKUP_PATTERN = new RegExp(`(${MARKUP})`);
const MARKUP_AND_PHRASES_PATTERN = new RegExp(`(${MARKUP}|${NOWRAP_SOURCE})`);

interface RichOptions {
  /**
   * Keep named phrases such as "Vapi-Silvassa Road" on one line (default). Turn it off in display headings, where a
   * phrase wider than its column would overflow instead of wrapping.
   */
  keepPhrases?: boolean;
}

/**
 * Page copy with light markup: the word TBD becomes a chip, *starred words* become italic emphasis (in the display
 * serif's italic) and ~tilde words~ never break across lines. Named phrases ("Vapi-Silvassa Road") also stay on one
 * line, wherever they appear (also in content strings), unless `keepPhrases` is false.
 */
export function rich(text: string, { keepPhrases = true }: RichOptions = {}): ReactNode {
  const parts = text.split(keepPhrases ? MARKUP_AND_PHRASES_PATTERN : MARKUP_PATTERN);
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
    if (keepPhrases && isNowrapPhrase(part)) {
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
