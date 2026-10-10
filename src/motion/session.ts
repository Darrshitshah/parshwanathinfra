/**
 * Has this document already navigated client-side? Owner: motion-lead.
 *
 * The S1 loader is for the first page a visitor lands on. If they arrive on the home page by navigating from another
 * page (the curtain already covered the change), the loader must not play on top of it. The transition provider
 * calls `noteClientNavigation()` when a navigation starts; the loader asks `hasNavigatedClientSide()` when it mounts.
 */
let navigations = 0;

export function noteClientNavigation(): void {
  navigations += 1;
}

export function hasNavigatedClientSide(): boolean {
  return navigations > 0;
}
