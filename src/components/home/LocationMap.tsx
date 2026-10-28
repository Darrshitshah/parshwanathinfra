/**
 * Location map entry point (Home, the project page and /contact). Server-renders the themed schematic of the
 * Vapi-Silvassa Road (labelled "Not to scale") and the glass card with the address, coordinates and map links, inside
 * a tiny client shell (map/SiteMap) that swaps in the live street map, MapLibre with OpenFreeMap tiles drawn in our
 * colours, once the section nears the viewport. No key, no account. Without JavaScript or WebGL, or if the tiles
 * fail, the schematic stays. Owner: pages-lead.
 */
import { SchematicFallback } from "@/components/map/SchematicFallback";
import { SiteInfoCard } from "@/components/map/SiteInfoCard";
import { SiteMap } from "@/components/map/SiteMap";
import { siteMapPlace, type MapPlace } from "@/components/map/place";
import { homeCopy } from "@/content/copy/home";

interface LocationMapProps {
  place?: MapPlace;
  className?: string;
  /** Show "Open in Google Maps" and "Get directions" in the card (off where the page already lists them next to the map). */
  links?: boolean;
}

export function LocationMap({ place = siteMapPlace(), className, links = true }: LocationMapProps) {
  const { location } = homeCopy;
  const { map } = location;
  const labels = {
    region: map.regionLabel,
    controls: map.controlsLabel,
    zoomIn: map.zoomIn,
    zoomOut: map.zoomOut,
    recenter: map.recenter,
    gestures: map.gestures,
  };
  return (
    <SiteMap
      className={className}
      geo={place.geo}
      title={place.name}
      roadName={place.road}
      labels={labels}
      captions={{ fallback: location.mapCaption, live: location.liveCaption }}
      fallback={<SchematicFallback place={place} />}
      card={<SiteInfoCard place={place} links={links} />}
    />
  );
}
