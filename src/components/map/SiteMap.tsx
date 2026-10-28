"use client";

/**
 * Client shell for the live location map. Tiny on purpose: it renders the server-made schematic and info card, watches
 * the frame with an IntersectionObserver, and only when the section is near the viewport (and the browser has WebGL
 * and is not saving data) imports the map canvas, which carries MapLibre and its CSS. So no route's first-load
 * JavaScript holds map code, and no tile is requested for visitors who never scroll to the location. A load, tile or
 * WebGL failure keeps (or restores) the schematic. Owner: pages-lead.
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ComponentProps, type ComponentType, type ReactNode } from "react";
import { useNear } from "@/lib/use-near";
import { MapShell } from "./MapShell";
import type { LngLat } from "./map-camera";
import { canShowLiveMap } from "./map-support";
import type { SiteMapCanvas as SiteMapCanvasComponent } from "./SiteMapCanvas";

/** If the map chunk itself cannot be fetched (offline, deploy in between), report a failure instead of throwing. */
type CanvasProps = ComponentProps<typeof SiteMapCanvasComponent>;

function ChunkFailed({ onFail }: CanvasProps) {
  useEffect(onFail, [onFail]);
  return null;
}

const SiteMapCanvas = lazy<ComponentType<CanvasProps>>(() =>
  import("./SiteMapCanvas").then(
    (module) => ({ default: module.SiteMapCanvas }),
    () => ({ default: ChunkFailed }),
  ),
);

/** Start loading while the section is still this far below the fold. */
const LOAD_MARGIN = "600px 0px";

export interface SiteMapLabels {
  region: string;
  controls: string;
  zoomIn: string;
  zoomOut: string;
  recenter: string;
  gestures: { windows: string; mac: string; mobile: string };
}

export interface MapAttribution {
  label: string;
  href: string;
}

interface SiteMapProps {
  geo: LngLat;
  title: string;
  roadName: string;
  /** Text comes from the server so the home copy file is not bundled into the client. */
  labels: SiteMapLabels;
  attribution: readonly MapAttribution[];
  captions: { fallback: string; live: string };
  /** Server-rendered schematic, shown until the map is ready and again if it fails. */
  fallback: ReactNode;
  /** Server-rendered glass info card. */
  card: ReactNode;
  className?: string;
}

type MapStatus = "idle" | "ready" | "failed";

export function SiteMap({ geo, title, roadName, labels, attribution, captions, fallback, card, className }: SiteMapProps) {
  const [frameRef, near] = useNear<HTMLDivElement>(LOAD_MARGIN);
  const [status, setStatus] = useState<MapStatus>("idle");
  const handleReady = useCallback(() => setStatus("ready"), []);
  const handleFail = useCallback(() => setStatus("failed"), []);
  const live = status === "ready";

  // Checked only once the frame is near, which never happens on the server or in the first client render.
  const supported = useMemo(() => near && canShowLiveMap(), [near]);

  return (
    <MapShell
      className={className}
      state={live ? "live" : "fallback"}
      frameRef={frameRef}
      card={card}
      caption={live ? captions.live : captions.fallback}
      frame={
        <>
          {live ? null : fallback}
          {supported && status !== "failed" ? (
            <Suspense fallback={null}>
              <SiteMapCanvas
                geo={geo}
                title={title}
                roadName={roadName}
                labels={labels}
                attribution={attribution}
                onReady={handleReady}
                onFail={handleFail}
              />
            </Suspense>
          ) : null}
        </>
      }
    />
  );
}
