"use client";

/**
 * The live Google map, imported lazily by SiteMap once the section nears the viewport. Loads the Maps JavaScript API,
 * draws a hybrid satellite map centred on the site pin, drops a themed Advanced Marker and adds our own glass zoom and
 * recenter controls. Google's logo, terms link and attribution stay visible, and the imagery gets no CSS filter.
 * Reports "ready" on the first idle and "failed" on any load or key error so the static fallback can take over.
 * Owner: pages-lead.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DEFAULT_ZOOM, buildMapOptions, loadGoogleMaps, onMapsAuthFailure, type GoogleMapInstance, type LatLngLiteral } from "@/lib/google-maps";
import type { SiteMapLabels } from "./SiteMap";
import "./site-map.css";

interface SiteMapCanvasProps {
  apiKey: string;
  mapId: string;
  geo: LatLngLiteral;
  title: string;
  labels: SiteMapLabels;
  onReady: () => void;
  onFail: () => void;
}

function createPin(): HTMLElement {
  const pin = document.createElement("div");
  pin.className = "site-pin";
  const halo = document.createElement("span");
  halo.className = "site-pin__halo";
  const dot = document.createElement("span");
  dot.className = "site-pin__dot";
  pin.append(halo, dot);
  return pin;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const CONTROL_PATHS = {
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  recenter: "M12 3v4M12 17v4M3 12h4M17 12h4",
} as const;

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="glass grid size-11 place-items-center rounded-full text-ink transition-transform duration-(--duration-quick) hover:scale-105"
    >
      {children}
    </button>
  );
}

function ControlIcon({ name }: { name: keyof typeof CONTROL_PATHS }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d={CONTROL_PATHS[name]} />
      {name === "recenter" ? <circle cx="12" cy="12" r="4.25" /> : null}
    </svg>
  );
}

export function SiteMapCanvas({ apiKey, mapId, geo, title, labels, onReady, onFail }: SiteMapCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const [ready, setReady] = useState(false);
  const { lat, lng } = geo;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const center = { lat, lng };
    let cancelled = false;
    let teardown = () => {};
    const stopAuthWatch = onMapsAuthFailure(onFail);

    loadGoogleMaps(apiKey)
      .then((api) => {
        if (cancelled) return;
        const background = getComputedStyle(host).getPropertyValue("--paper-sunk").trim() || undefined;
        const map = new api.Map(host, buildMapOptions(center, mapId, background));
        const marker = new api.AdvancedMarkerElement({ map, position: center, content: createPin(), title });
        mapRef.current = map;
        const idle = map.addListener("idle", () => {
          idle.remove();
          setReady(true);
          onReady();
        });
        teardown = () => {
          idle.remove();
          marker.map = null;
        };
      })
      .catch(() => {
        if (!cancelled) onFail();
      });

    return () => {
      cancelled = true;
      stopAuthWatch();
      teardown();
      mapRef.current = null;
    };
  }, [apiKey, mapId, lat, lng, title, onReady, onFail]);

  function zoomBy(step: number) {
    const map = mapRef.current;
    if (map) map.setZoom((map.getZoom() ?? DEFAULT_ZOOM) + step);
  }

  function recenter() {
    const map = mapRef.current;
    if (!map) return;
    const center = { lat, lng };
    if (prefersReducedMotion()) map.setCenter(center);
    else map.panTo(center);
    map.setZoom(DEFAULT_ZOOM);
  }

  return (
    <>
      <div
        ref={hostRef}
        role="region"
        aria-label={labels.region}
        className={`absolute inset-0 isolate transition-opacity duration-(--duration-slow) ${ready ? "opacity-100" : "opacity-0"}`}
      />
      {ready ? (
        <div role="group" aria-label={labels.controls} className="absolute right-3 top-3 z-[2] flex flex-col gap-2">
          <ControlButton label={labels.zoomIn} onClick={() => zoomBy(1)}>
            <ControlIcon name="plus" />
          </ControlButton>
          <ControlButton label={labels.zoomOut} onClick={() => zoomBy(-1)}>
            <ControlIcon name="minus" />
          </ControlButton>
          <ControlButton label={labels.recenter} onClick={recenter}>
            <ControlIcon name="recenter" />
          </ControlButton>
        </div>
      ) : null}
    </>
  );
}
