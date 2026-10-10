/**
 * Which clicks the page transition may take over. Owner: motion-lead.
 *
 * Pure rules, no React. The transition provider listens for clicks before Next's `<Link>` does, asks
 * `evaluateClick`, and only when the answer is "transition" calls `preventDefault` and plays the curtain.
 * Everything else (new tabs, downloads, mailto, external sites, the same page) is left to the browser and Next.
 *
 * Opt a link out with `data-transition-ignore` on it or any ancestor. Links that act as buttons are left alone too.
 */

export type NativeReason =
  | "no-anchor"
  | "default-prevented"
  | "not-primary-button"
  | "modifier-key"
  | "download"
  | "new-context"
  | "opted-out"
  | "interactive-role"
  | "external-rel"
  | "invalid-url"
  | "unsupported-protocol"
  | "cross-origin"
  | "file-link"
  | "same-url";

export type ClickDecision =
  | { kind: "transition"; url: URL }
  /** Same page, different #fragment: scroll, do not navigate. */
  | { kind: "hash"; url: URL }
  | { kind: "native"; reason: NativeReason };

export interface ClickLike {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export interface LocationLike {
  href: string;
  origin: string;
}

/** `data-transition-ignore` (or `data-no-transition`) on the link or any ancestor. */
export const OPT_OUT_SELECTOR = "[data-transition-ignore], [data-no-transition]";
/** Links that behave as buttons or disclosure triggers (drawers, menus) must not start a page transition. */
export const WIDGET_SELECTOR = '[role="button"], [aria-haspopup], [aria-controls], [aria-expanded]';
/** Same-origin links to files the browser should open or download itself. */
export const FILE_LINK = /\.(?:pdf|zip|rar|7z|docx?|xlsx?|pptx?|csv|txt|rtf|xml|json|png|jpe?g|gif|webp|avif|svg|ico|mp3|mp4|mov|webm|wav|glb|gltf)$/i;

function native(reason: NativeReason): ClickDecision {
  return { kind: "native", reason };
}

/** The `<a href>` a click landed on, or null (SVG anchors and non-link targets are never intercepted). */
export function findAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  const anchor = target.closest("a[href]");
  return anchor instanceof HTMLAnchorElement ? anchor : null;
}

export function evaluateClick(anchor: HTMLAnchorElement | null, event: ClickLike, location: LocationLike): ClickDecision {
  if (!anchor) return native("no-anchor");
  if (event.defaultPrevented) return native("default-prevented");
  if (event.button !== 0) return native("not-primary-button");
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return native("modifier-key");
  if (anchor.hasAttribute("download")) return native("download");

  const target = anchor.getAttribute("target");
  if (target && target !== "_self") return native("new-context");
  if (anchor.closest(OPT_OUT_SELECTOR)) return native("opted-out");
  if (anchor.matches(WIDGET_SELECTOR)) return native("interactive-role");
  if (/\bexternal\b/i.test(anchor.getAttribute("rel") ?? "")) return native("external-rel");

  let url: URL;
  let current: URL;
  try {
    url = new URL(anchor.href, location.href);
    current = new URL(location.href);
  } catch {
    return native("invalid-url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return native("unsupported-protocol");
  if (url.origin !== location.origin) return native("cross-origin");
  if (FILE_LINK.test(url.pathname)) return native("file-link");

  const samePage = url.pathname === current.pathname && url.search === current.search;
  if (samePage) return url.hash ? { kind: "hash", url } : native("same-url");
  return { kind: "transition", url };
}

/** "/about?x=1#team" from a URL: what `router.push` should receive. */
export function toRouterHref(url: URL): string {
  return `${url.pathname}${url.search}${url.hash}`;
}
