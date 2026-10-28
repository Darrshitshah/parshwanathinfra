/**
 * Camera for the live map: centred on the site pin from the content, zoomed so the frame shows the Vapi to Silvassa
 * context around it, and fenced to the region so a stray drag cannot lose the site. Pure. Owner: pages-lead.
 */
export interface LngLat {
  lat: number;
  lng: number;
}

/** Half the width and height (degrees) of the area the opening view must show around the site: Vapi to Silvassa. */
export const CONTEXT_SPAN = { lng: 0.095, lat: 0.085 } as const;
/** How far (degrees) the view may be panned away from the site. */
export const PAN_FENCE = 0.6;
export const MIN_ZOOM = 8;
export const MAX_ZOOM = 17;
/** The opening zoom stays in this band whatever the frame size. */
export const OPENING_ZOOM = { min: 10, max: 12.4 } as const;
/** Fallback when the frame cannot be measured. */
export const DEFAULT_ZOOM = 11.4;

export type Bounds = [[number, number], [number, number]];

/** South-west and north-east corners of a box centred on the site, so a camera fitted to it stays centred on the pin. */
export function contextBounds({ lat, lng }: LngLat): Bounds {
  return [
    [lng - CONTEXT_SPAN.lng, lat - CONTEXT_SPAN.lat],
    [lng + CONTEXT_SPAN.lng, lat + CONTEXT_SPAN.lat],
  ];
}

export function panBounds({ lat, lng }: LngLat): Bounds {
  return [
    [lng - PAN_FENCE, lat - PAN_FENCE],
    [lng + PAN_FENCE, lat + PAN_FENCE],
  ];
}

export function clampOpeningZoom(zoom: number | undefined): number {
  if (zoom === undefined || !Number.isFinite(zoom)) return DEFAULT_ZOOM;
  return Math.min(OPENING_ZOOM.max, Math.max(OPENING_ZOOM.min, zoom));
}
