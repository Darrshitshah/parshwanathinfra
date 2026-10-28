"use client";

/**
 * Client shell for the live location map. Tiny on purpose: it renders an empty themed frame and the info card, watches
 * the frame with an IntersectionObserver, and only when the section is near the viewport (and the browser has WebGL
 * and is not saving data) imports the map canvas, which carries MapLibre and its CSS. So no route's first-load
 * JavaScript holds map code, and no tile is requested for visitors who never scroll to the location. A load, tile or
 * WebGL failure shows the schematic. The schematic is never shown as a loading placeholder (Darshit, 2026-10-28): while
 * the map loads, the frame stays plain, so visitors never see the sketch flash before the real map. Owner: pages-lead.
 */
import { lazy, Suspense, useCallback, useEffect, useState, useSyncExternalStore, type ComponentProps, type ComponentType, type ReactNode } from "react";
import { useNear } from "@/lib/use-near";
import { MapShell } from "./MapShell";
import type { LngLat } from "./map-camera";
import { liveMapCapability } from "./map-support";
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

/** WebGL and save-data are browser facts: checked once on the client, unknown (null) on the server. */
const unknownOnServer = () => null;
const noSubscribe = () => () => {};

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

interface SiteMapProps {
  geo: LngLat;
  title: string;
  roadName: string;
  /** Text comes from the server so the home copy file is not bundled into the client. */
  labels: SiteMapLabels;
  captions: { fallback: string; live: string };
  /** Server-rendered schematic, shown only when the live map cannot run or fails. */
  fallback: ReactNode;
  /** Server-rendered glass info card. */
  card: ReactNode;
  className?: string;
}

type MapStatus = "idle" | "ready" | "failed";

export function SiteMap({ geo, title, roadName, labels, captions, fallback, card, className }: SiteMapProps) {
  const [frameRef, near] = useNear<HTMLDivElement>(LOAD_MARGIN);
  const [status, setStatus] = useState<MapStatus>("idle");
  const capable = useSyncExternalStore(noSubscribe, liveMapCapability, unknownOnServer);
  const handleReady = useCallback(() => setStatus("ready"), []);
  const handleFail = useCallback(() => setStatus("failed"), []);

  const failed = status === "failed" || capable === false;
  const live = status === "ready" && !failed;
  const state = failed ? "fallback" : live ? "live" : "loading";

  return (
    <MapShell
      className={className}
      state={state}
      frameRef={frameRef}
      card={card}
      caption={failed ? captions.fallback : captions.live}
      frame={
        <>
          {failed ? fallback : null}
          {near && capable && !failed ? (
            <Suspense fallback={null}>
              <SiteMapCanvas
                geo={geo}
                title={title}
                roadName={roadName}
                labels={labels}
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
