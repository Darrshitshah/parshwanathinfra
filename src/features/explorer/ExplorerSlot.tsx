"use client";

/**
 * The mount point for the standalone building explorer (`data-slot="explorer"`): the static fallback shows until the
 * slot is near the viewport, then the explorer code loads on demand and replaces it.
 */
import { lazy, Suspense, type ReactNode } from "react";
import { useNearViewport } from "../plan/use-near-viewport";

const Picker = lazy(() => import("./BuildingExplorerPicker").then((module) => ({ default: module.BuildingExplorerPicker })));

export function ExplorerSlot({ children, initialBuildingId, rootMargin = "900px 0px" }: { children?: ReactNode; initialBuildingId?: string; rootMargin?: string }) {
  const [hostRef, load] = useNearViewport<HTMLDivElement>(rootMargin);
  return (
    <div ref={hostRef} className="ex-slot" data-loaded={load ? "true" : "false"}>
      {load ? (
        <Suspense fallback={children}>
          <Picker initialBuildingId={initialBuildingId} />
        </Suspense>
      ) : (
        children
      )}
    </div>
  );
}
