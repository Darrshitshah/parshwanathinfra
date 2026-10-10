/**
 * Text link: the site's default call to action. The underline draws on hover and focus (CSS only).
 * Internal paths use next/link (page transitions intercept those clicks at document level); in-page hashes,
 * mailto and tel use a plain anchor; external URLs open in a new tab with an announced hint.
 */
import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { en } from "@/content/i18n/en";
import { cn } from "./cn";
import { Icon } from "./Icon";

interface TextLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  /** Trailing arrow icon. "up-right" is the default for external links. */
  arrow?: "right" | "up-right" | false;
  /** Force new-tab behaviour; otherwise inferred from an http(s) URL. */
  external?: boolean;
  /** Extra accessible name when the visible text is not enough. */
  ariaLabel?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

function isExternalUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function isPlainAnchor(href: string): boolean {
  return href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:");
}

export function TextLink({ href, children, className, arrow, external, ariaLabel, onClick }: TextLinkProps) {
  const isExternal = external ?? isExternalUrl(href);
  const trailing = arrow === undefined ? (isExternal ? "up-right" : false) : arrow;
  const classes = cn("link-draw inline-flex items-baseline gap-[0.4em]", className);
  const content = (
    <>
      <span>{children}</span>
      {trailing ? (
        <Icon
          name={trailing === "up-right" ? "arrow-up-right" : "arrow-right"}
          size={14}
          className="relative top-[0.1em] shrink-0 self-center"
        />
      ) : null}
      {isExternal ? <span className="sr-only"> ({en.common.opensInNewTab})</span> : null}
    </>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} aria-label={ariaLabel} onClick={onClick}>
        {content}
      </a>
    );
  }
  if (isPlainAnchor(href)) {
    return (
      <a href={href} className={classes} aria-label={ariaLabel} onClick={onClick}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} aria-label={ariaLabel} onClick={onClick}>
      {content}
    </Link>
  );
}
