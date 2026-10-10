/**
 * Tiny dependency-free helpers for the thin layer. Owner: motion-lead.
 */

/** The items that exist: drops nulls and undefined, so optional parts can be passed around as one list. */
export function present<T>(...items: (T | null | undefined)[]): T[] {
  return items.filter((item): item is T => item !== null && item !== undefined);
}
