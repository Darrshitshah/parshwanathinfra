/**
 * What the S8 cursor should look like over a given element. Owner: motion-lead.
 *
 * Pure DOM lookups, so the rules are unit-tested. Nearest element wins, walking up from the one under the pointer:
 *   [data-cursor="native"]  or a text field   native cursor, custom cursor hidden
 *   [data-cursor-label="View"]                labelled disc ("View", "Drag", "Explore", any short word)
 *   a, button, [role=button] ... [data-cursor] the circle grows into a ring
 *   anything else                             the small inverting circle
 * `data-cursor="grow"` forces the ring on a non-interactive element; `data-cursor="default"` forces the small circle.
 */

export type CursorState =
  | { kind: "default" }
  | { kind: "grow" }
  | { kind: "label"; label: string }
  | { kind: "native" };

export const DEFAULT_STATE: CursorState = { kind: "default" };
export const GROW_STATE: CursorState = { kind: "grow" };
export const NATIVE_STATE: CursorState = { kind: "native" };

/** Longest label that fits the disc. */
export const MAX_LABEL_LENGTH = 14;

/** Text-like fields keep the native cursor. Keep in sync with the `:is(...)` list in cursor.css. */
export const NATIVE_SELECTOR =
  'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="image"]), textarea, select, [contenteditable=""], [contenteditable="true"]';

const INTERACTIVE_SELECTOR =
  'a[href], button, summary, input[type="button"], input[type="submit"], input[type="reset"], input[type="checkbox"], input[type="radio"], input[type="range"], label[for], [role="button"], [role="link"], [role="tab"], [role="menuitem"]';

export function sameState(a: CursorState, b: CursorState): boolean {
  if (a.kind !== b.kind) return false;
  return a.kind === "label" && b.kind === "label" ? a.label === b.label : true;
}

function stateFor(element: Element): CursorState | null {
  const explicit = element.getAttribute("data-cursor");
  if (explicit === "native" || element.matches(NATIVE_SELECTOR)) return NATIVE_STATE;

  const label = element.getAttribute("data-cursor-label")?.replace(/\s+/g, " ").trim();
  if (label) return { kind: "label", label: label.slice(0, MAX_LABEL_LENGTH) };

  if (explicit === "default") return DEFAULT_STATE;
  if (explicit !== null || element.matches(INTERACTIVE_SELECTOR)) return GROW_STATE;
  return null;
}

export function resolveCursorState(target: Element | null): CursorState {
  // The walk stops before <html>: the root carries the cursor's own on-flag and must never decide a state.
  for (let element = target; element && element.parentElement; element = element.parentElement) {
    const state = stateFor(element);
    if (state) return state;
  }
  return DEFAULT_STATE;
}
