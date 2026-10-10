/**
 * Same-page #fragment links under Lenis. Owner: motion-lead.
 *
 * With native scrolling the browser (and Next) already do the right thing, so this only acts while Lenis runs:
 * the jump becomes a smooth scroll that honours `scroll-margin-top` / `scroll-padding-top`, the URL gets the
 * fragment, and focus moves to the target like a native fragment navigation would.
 */
import { getLenis, scrollToTarget } from "@/motion/scroll";

const NATIVELY_FOCUSABLE = "a[href], button, input, select, textarea, summary, [tabindex]";

export function handleHashClick(url: URL, event: Event): boolean {
  if (!getLenis()) return false;
  let id: string;
  try {
    id = decodeURIComponent(url.hash.slice(1));
  } catch {
    return false;
  }
  const target = id ? document.getElementById(id) : null;
  if (!target) return false;

  event.preventDefault();
  window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  scrollToTarget(target);

  // Like a native fragment jump: focus the target, but do not leave a tabindex behind once focus moves on.
  if (!target.matches(NATIVELY_FOCUSABLE)) {
    target.setAttribute("tabindex", "-1");
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
  }
  target.focus({ preventScroll: true });
  return true;
}
