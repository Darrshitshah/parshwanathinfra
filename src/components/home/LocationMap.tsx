/**
 * Location map entry point (Home, the project page and /contact). With NEXT_PUBLIC_GOOGLE_MAPS_API_KEY set, the site
 * shows a Google satellite map that loads only when the section nears the viewport (see map/SiteMap). Without a key it
 * renders the static, themed fallback (a schematic of the Vapi-Silvassa Road, labelled "Not to scale", plus the glass
 * card with the address, coordinates and map links), so the page never shows a broken map. Server component: with no
 * key it ships no client JavaScript at all. Owner: pages-lead.
 */
import { MapShell } from "@/components/map/MapShell";
import { SchematicFallback } from "@/components/map/SchematicFallback";
import { SiteInfoCard } from "@/components/map/SiteInfoCard";
import { SiteMap } from "@/components/map/SiteMap";
import { siteMapPlace, type MapPlace } from "@/components/map/place";
import { homeCopy } from "@/content/copy/home";
import { getMapId, getMapsApiKey } from "@/lib/google-maps";

interface LocationMapProps {
  place?: MapPlace;
  className?: string;
  /** Show "Open in Google Maps" and "Get directions" in the card (off where the page already lists them next to the map). */
  links?: boolean;
}

export function LocationMap({ place = siteMapPlace(), className, links = true }: LocationMapProps) {
  const apiKey = getMapsApiKey();
  const fallback = <SchematicFallback place={place} />;
  const card = <SiteInfoCard place={place} links={links} />;
  if (!apiKey) {
    return <MapShell className={className} state="fallback" frame={fallback} card={card} caption={homeCopy.location.mapCaption} />;
  }
  const { map } = homeCopy.location;
  const labels = { region: map.regionLabel, controls: map.controlsLabel, zoomIn: map.zoomIn, zoomOut: map.zoomOut, recenter: map.recenter };
  const captions = { fallback: homeCopy.location.mapCaption, live: homeCopy.location.satelliteCaption };
  return (
    <SiteMap apiKey={apiKey} mapId={getMapId()} geo={place.geo} title={place.name} labels={labels} captions={captions} fallback={fallback} card={card} />
  );
}
