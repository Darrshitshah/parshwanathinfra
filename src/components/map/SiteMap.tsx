"use client";

/**
 * Client shell for the live location map (only rendered when a Google Maps key is configured). Tiny on purpose: it
 * renders the server-made static fallback and info card, watches the frame with an IntersectionObserver, and only
 * when the section is near the viewport imports the map canvas, which in turn loads the Google Maps API. So neither
 * the canvas code nor Google's script is part of any route's initial JavaScript, and no Maps request is made for
 * visitors who never scroll to the location. A load or key failure keeps (or restores) the static fallback.
 * Owner: pages-lead.
 */
import { lazy, Suspense, useCallback, useState, type ReactNode } from "react";
import { useNear } from "@/lib/use-near";
import type { LatLngLiteral } from "@/lib/google-maps";
import { MapShell } from "./MapShell";

const SiteMapCanvas = lazy(() => import("./SiteMapCanvas").then((module) => ({ default: module.SiteMapCanvas })));

/** Start loading while the section is still this far below the fold. */
const LOAD_MARGIN = "600px 0px";

export interface SiteMapLabels {
  region: string;
  controls: string;
  zoomIn: string;
  zoomOut: string;
  recenter: string;
}

interface SiteMapProps {
  apiKey: string;
  mapId: string;
  geo: LatLngLiteral;
  title: string;
  /** Text comes from the server so the home copy file is not bundled into the client. */
  labels: SiteMapLabels;
  captions: { fallback: string; live: string };
  /** Server-rendered static fallback visual, shown until the map is ready and again if it fails. */
  fallback: ReactNode;
  /** Server-rendered glass info card. */
  card: ReactNode;
}

type MapStatus = "idle" | "ready" | "failed";

export function SiteMap({ apiKey, mapId, geo, title, labels, captions, fallback, card }: SiteMapProps) {
  const [frameRef, near] = useNear<HTMLDivElement>(LOAD_MARGIN);
  const [status, setStatus] = useState<MapStatus>("idle");
  const handleReady = useCallback(() => setStatus("ready"), []);
  const handleFail = useCallback(() => setStatus("failed"), []);
  const live = status === "ready";

  return (
    <MapShell
      state={live ? "live" : "fallback"}
      frameRef={frameRef}
      card={card}
      caption={live ? captions.live : captions.fallback}
      frame={
        <>
          {live ? null : fallback}
          {near && status !== "failed" ? (
            <Suspense fallback={null}>
              <SiteMapCanvas apiKey={apiKey} mapId={mapId} geo={geo} title={title} labels={labels} onReady={handleReady} onFail={handleFail} />
            </Suspense>
          ) : null}
        </>
      }
    />
  );
}
