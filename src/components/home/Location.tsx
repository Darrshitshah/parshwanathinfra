/**
 * Location: the address, the pin, the live street map in our colours (a labelled schematic before it loads or if it
 * cannot) and the map links.
 * Landmarks and distances are TBD chips until confirmed. Used on Home and on the project page (id="location").
 * Owner: pages-lead.
 */
import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";
import { Eyebrow } from "@/components/ui/Section";
import { Tbd } from "@/components/ui/Tbd";
import { rich, withTbd } from "@/components/ui/with-tbd";
import { formatCoordinates } from "@/components/ui/map-links";
import { homeCopy } from "@/content/copy/home";
import { shivShiva } from "@/content/projects";
import { LocationMap } from "./LocationMap";

interface LocationProps {
  id?: string;
  index?: string;
  /** Colour block: plain ivory (default) or the calm mist band. */
  tone?: "paper" | "mist";
}

function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="t-mono-sm text-ink-muted">{label}</dt>
      <dd className="m-0 text-ink">{children}</dd>
    </div>
  );
}

export function Location({ id = "location", index = "06", tone = "paper" }: LocationProps) {
  const location = shivShiva.location;
  const labels = homeCopy.location.labels;
  const landmarks = location.landmarks;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("sheet", tone === "mist" ? "tone-mist" : "tone-paper")}>
      <div className="wrap">
        <Eyebrow index={index}>{homeCopy.location.eyebrow}</Eyebrow>
        <h2 id={`${id}-title`} className="t-display-2 mt-10 text-ink md:mt-14">
          {rich(homeCopy.location.heading, { keepPhrases: false })}
        </h2>
        <div className="mt-10 grid gap-12 md:mt-14 lg:grid-cols-12 lg:gap-x-(--gutter)">
          <div className="lg:col-span-5">
            <p className="t-lead m-0 text-ink-muted">{rich(homeCopy.location.body)}</p>

            <dl className="m-0 mt-10 grid gap-0">
              <FactRow label={labels.address}>
                <address className="not-italic">{rich(location.address)}</address>
              </FactRow>
              <FactRow label={labels.pin}>
                <span className="t-mono">{formatCoordinates(location.geo)}</span>
              </FactRow>
              <FactRow label={labels.landmarks}>
                {landmarks === "TBD" ? (
                  <Tbd />
                ) : (
                  <ul className="m-0 grid list-none gap-1 p-0">
                    {landmarks.map((landmark) => (
                      <li key={landmark.name}>{landmark.name}</li>
                    ))}
                  </ul>
                )}
              </FactRow>
              <FactRow label={labels.distances}>
                {landmarks === "TBD" ? (
                  <Tbd />
                ) : (
                  <ul className="m-0 grid list-none gap-1 p-0">
                    {landmarks.map((landmark) => (
                      <li key={landmark.name}>
                        {landmark.name}: {withTbd(landmark.distance)}
                      </li>
                    ))}
                  </ul>
                )}
              </FactRow>
            </dl>
          </div>

          <div className="lg:col-span-7">
            <LocationMap />
          </div>
        </div>
      </div>
    </section>
  );
}
