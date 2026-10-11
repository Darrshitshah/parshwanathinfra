"use client";

/**
 * Mount point for the 3D diorama (S4), tiny on purpose. Renders `children` (the static fallback, e.g. the overview still)
 * until the slot is near the viewport, then loads the diorama code on demand. Three.js is in no route's initial JavaScript.
 *
 *   <section id="walk" data-slot="diorama">
 *     <DioramaSlot onBuildingSelect={(id) => router.push(`/projects/shiv-shiva?building=${id}#explorer`)}>
 *       <StaticFigure />
 *     </DioramaSlot>
 *   </section>
 */
import { lazy, Suspense, type ReactNode } from "react";
import { useNear } from "./use-near";

const Diorama = lazy(() => import("./Diorama").then((module) => ({ default: module.Diorama })));

export interface DioramaSlotProps {
  /** Static fallback: shown on the server, without JavaScript, and while the diorama loads. */
  children?: ReactNode;
  /** Called with a plan building id when a building is clicked (WebGL) or chosen from the caption list. */
  onBuildingSelect?: (buildingId: string) => void;
  /** How early to start loading, as an IntersectionObserver rootMargin. */
  rootMargin?: string;
}

export function DioramaSlot({ children, onBuildingSelect, rootMargin = "900px 0px" }: DioramaSlotProps) {
  const [hostRef, load] = useNear<HTMLDivElement>(rootMargin);
  return (
    <div ref={hostRef} data-diorama-slot data-loaded={load ? "true" : "false"}>
      {load ? (
        <Suspense fallback={children}>
          <Diorama onBuildingSelect={onBuildingSelect} fallback={children} />
        </Suspense>
      ) : (
        children
      )}
    </div>
  );
}
