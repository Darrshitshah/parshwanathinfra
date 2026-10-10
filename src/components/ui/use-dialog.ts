/**
 * Shared modal behaviour for the enquiry drawer, the mobile menu and the gallery lightbox. Owner: pages-lead.
 *
 * While `open` is true:
 *  - focus moves into the dialog (the panel, or `initialFocusRef`) and Tab / Shift+Tab stay inside it;
 *  - Escape calls `onClose`;
 *  - the page behind is made inert (the [data-app-root] element SiteShell renders) and cannot scroll;
 *  - on close, focus returns to the element that had it when the dialog opened.
 * Dialogs are rendered through a portal to <body>, outside [data-app-root], so inert never reaches them.
 */
import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

let scrollLocks = 0;
let savedOverflow = "";
let savedPaddingRight = "";

/**
 * Stop the page scrolling behind a dialog. Balanced, so overlapping dialogs and StrictMode are safe. Where the
 * browser draws a classic scrollbar, the space it frees is padded back so the page does not jump sideways.
 */
export function lockScroll(): () => void {
  const root = document.documentElement;
  if (scrollLocks === 0) {
    const scrollbar = window.innerWidth - root.clientWidth;
    savedOverflow = root.style.overflow;
    savedPaddingRight = root.style.paddingRight;
    root.style.overflow = "hidden";
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;
  }
  scrollLocks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    scrollLocks -= 1;
    if (scrollLocks === 0) {
      root.style.overflow = savedOverflow;
      root.style.paddingRight = savedPaddingRight;
    }
  };
}

let inertLocks = 0;

/** Make the app chrome inert (not focusable, not clickable, hidden from assistive technology) behind a dialog. */
export function makeAppInert(): () => void {
  const root = document.querySelector<HTMLElement>("[data-app-root]");
  if (!root) return () => undefined;
  if (inertLocks === 0) root.inert = true;
  inertLocks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    inertLocks -= 1;
    if (inertLocks === 0) root.inert = false;
  };
}

export function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.closest("[hidden],[inert],[aria-hidden='true']") && getComputedStyle(element).visibility !== "hidden",
  );
}

interface UseDialogOptions {
  open: boolean;
  panelRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Element to focus on open instead of the panel itself. */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function useDialog({ open, panelRef, onClose, initialFocusRef }: UseDialogOptions): void {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const releaseScroll = lockScroll();
    const releaseInert = makeAppInert();

    (initialFocusRef?.current ?? panel)?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = getFocusable(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      releaseInert();
      releaseScroll();
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open, panelRef, initialFocusRef]);
}
