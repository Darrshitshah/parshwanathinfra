/** The place the map shows, read from the content (never hard-coded in components). Owner: pages-lead. */
import { shivShiva } from "@/content/projects";

export interface MapPlace {
  name: string;
  address: string;
  road: string;
  geo: { lat: number; lng: number };
  mapUrl: string;
}

export function siteMapPlace(): MapPlace {
  const { location } = shivShiva;
  return { name: shivShiva.name, address: location.address, road: location.road, geo: location.geo, mapUrl: location.mapUrl };
}
