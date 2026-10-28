/**
 * Glass info card for the map: the site name, address, pin coordinates and (unless `links` is false) the two map links, all as real text.
 * Under the map on phones, over its bottom-left corner from md (the map credit sits bottom-right, the controls
 * top-right). Server component. Owner: pages-lead.
 */
import { TextLink } from "@/components/ui/TextLink";
import { directionsUrl, formatCoordinates } from "@/components/ui/map-links";
import { homeCopy } from "@/content/copy/home";
import { en } from "@/content/i18n/en";
import type { MapPlace } from "./place";

export function SiteInfoCard({ place, links = true }: { place: MapPlace; links?: boolean }) {
  return (
    <div className="glass z-[2] mt-3 rounded-(--radius-sm) p-4 md:absolute md:bottom-3 md:left-3 md:mt-0 md:w-[19rem]">
      <p className="t-mono-sm m-0 text-brick-ink">{homeCopy.location.map.siteLabel}</p>
      <p className="m-0 mt-1 font-display text-[1.375rem] font-medium uppercase leading-none text-ink">{place.name}</p>
      <p className="t-small m-0 mt-2 text-ink-muted">{place.address}</p>
      <p className="t-mono-sm m-0 mt-1 text-ink">{formatCoordinates(place.geo)}</p>
      {links ? (
        <p className="m-0 mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <TextLink href={place.mapUrl} className="t-small">
            {en.common.openInMaps}
          </TextLink>
          <TextLink href={directionsUrl(place.geo)} className="t-small">
            {en.common.getDirections}
          </TextLink>
        </p>
      ) : null}
    </div>
  );
}
