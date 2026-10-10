/** Map links built from the content's coordinates. No API key needed. Owner: pages-lead. */

/** Google Maps directions to a point (opens the route planner with the point as the destination). */
export function directionsUrl(geo: { lat: number; lng: number }): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${geo.lat},${geo.lng}`;
}

/** "20.2935° N · 72.9933° E" for a point. */
export function formatCoordinates(geo: { lat: number; lng: number }): string {
  const latitude = `${Math.abs(geo.lat).toFixed(4)}° ${geo.lat >= 0 ? "N" : "S"}`;
  const longitude = `${Math.abs(geo.lng).toFixed(4)}° ${geo.lng >= 0 ? "E" : "W"}`;
  return `${latitude} · ${longitude}`;
}
