"use client";

/**
 * The mount point for the standalone building explorer (`data-slot="explorer"`): the static fallback shows until the
 * slot is near the viewport, then the explorer code loads on demand and replaces it. A deep link
 * (`?building=<id>#homes`, e.g. from the diorama) loads it at once with that block open; the picker ignores an id that
 * is not an explorable block. The page is static, so the query is read in the browser after hydration.
 */
import { lazy, Suspense, useSyncExternalStore, type ReactNode } from "react";
import { useNearViewport } from "../plan/use-near-viewport";

const Picker = lazy(() => import("./BuildingExplorerPicker").then((module) => ({ default: module.BuildingExplorerPicker })));

/** The block named by `?building=` in the address bar, or undefined. */
export function buildingFromSearch(search: string): string | undefined {
  const id = new URLSearchParams(search).get("building");
  return id && /^[a-z0-9-]{1,40}$/.test(id) ? id : undefined;
}

const subscribeNever = () => () => undefined;

export function ExplorerSlot({ children, initialBuildingId, rootMargin = "900px 0px" }: { children?: ReactNode; initialBuildingId?: string; rootMargin?: string }) {
  const [hostRef, near] = useNearViewport<HTMLDivElement>(rootMargin);
  const search = useSyncExternalStore(subscribeNever, () => window.location.search, () => "");
  const linked = buildingFromSearch(search);
  const load = near || linked !== undefined;
  return (
    <div ref={hostRef} className="ex-slot" data-loaded={load ? "true" : "false"}>
      {load ? (
        <Suspense fallback={children}>
          <Picker key={linked ?? ""} initialBuildingId={linked ?? initialBuildingId} />
        </Suspense>
      ) : (
        children
      )}
    </div>
  );
}
