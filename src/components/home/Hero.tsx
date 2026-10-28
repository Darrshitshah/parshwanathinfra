/**
 * Home hero (S2 mounts at data-slot="sky-descent"). A full-bleed picture with the uppercase wordmark over it, one
 * script word, a short statement and a round Enquire disc. The picture is `HeroFilm`: the township film (short cut on
 * phones, full cut on desktop) over a poster. Static and fully visible without JavaScript: the poster is the LCP image
 * (data-hero-image). A soft ink gradient sits between picture and type, so the ivory text holds its contrast on any
 * frame of the film in both themes.
 *
 * Hooks for the Phase 2 sky descent: [data-hero-poster] wraps the image, [data-hero-wordmark] is the h1,
 * [data-hero-statement] the statement. Owner: pages-lead.
 */
import { Magnetic } from "@/components/cursor";
import { EnquireButton } from "@/components/ui/EnquireButton";
import { formatCoordinates } from "@/components/ui/map-links";
import { Seal } from "@/components/ui/Seal";
import { TextLink } from "@/components/ui/TextLink";
import { rich } from "@/components/ui/with-tbd";
import { homeCopy } from "@/content/copy/home";
import { en } from "@/content/i18n/en";
import { heroFilm } from "@/content/hero-film";
import { shivShiva } from "@/content/projects";
import { site } from "@/content/site";
import { HeroFilm } from "./HeroFilm";

/** "Shiv Shiva Township" becomes the wordmark words ["Shiv", "Shiva"] and the suffix "Township". */
function splitName(name: string): { words: string[]; suffix: string } {
  const match = /^(.*?)\s+(Township)$/.exec(name);
  const base = match?.[1] ?? name;
  return { words: base.split(/\s+/), suffix: match?.[2] ?? "" };
}

export function Hero() {
  const { words, suffix } = splitName(shivShiva.name);
  const geo = site.contact.office.geo;

  return (
    <section
      id="top"
      data-slot="sky-descent"
      aria-labelledby="hero-title"
      className="on-photo relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-(--block-ink)"
    >
      <HeroFilm film={heroFilm} />
      <div className="hero-scrim absolute inset-0 -z-10" aria-hidden="true" />

      <div className="wrap relative flex flex-1 flex-col pb-[calc(var(--sheet-r)+2.25rem)] pt-[calc(var(--header-h)+clamp(1.5rem,6vh,4.5rem))]">
        <div className="flex flex-col items-center text-center">
          <p className="t-mono-sm m-0 text-ink-muted">{homeCopy.hero.eyebrow}</p>
          <h1 id="hero-title" data-hero-wordmark="" className="relative mt-5 md:mt-6">
            <span className="t-display-1 hero-wordmark block text-ink md:text-[clamp(7rem,15.5vw,16.5rem)]">
              {words.map((word) => (
                <span key={word} className="block">
                  {word}
                </span>
              ))}
            </span>
            {suffix ? <span className="hero-script">{suffix}</span> : null}
          </h1>
        </div>

        <div className="mt-auto grid items-end gap-8 pt-14 md:grid-cols-12 md:gap-x-(--gutter)">
          <div className="md:col-span-6 lg:col-span-5" data-hero-statement="">
            <p className="t-lead m-0 max-w-[27rem] text-ink">{rich(homeCopy.hero.statement)}</p>
            <p className="t-mono-sm mb-0 mt-5 flex flex-wrap gap-x-5 gap-y-1 text-ink-muted">
              <span>{homeCopy.hero.by}</span>
              <span>{formatCoordinates(geo)}</span>
            </p>
          </div>
          <div className="flex items-end justify-between gap-6 md:col-span-6 md:justify-end md:gap-10 lg:col-span-7">
            <TextLink href="/projects/shiv-shiva#plan" arrow="right" className="t-mono-sm pb-2 text-ink">
              {en.common.explorePlan}
            </TextLink>
            <Magnetic>
              <EnquireButton size="lg">{en.enquiry.open}</EnquireButton>
            </Magnetic>
          </div>
        </div>

        <Seal size={88} spin className="absolute right-(--gutter) top-[calc(var(--header-h)+1.5rem)] hidden text-ink opacity-90 lg:block" />
      </div>
    </section>
  );
}
