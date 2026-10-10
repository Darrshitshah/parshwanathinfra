/**
 * Home hero (S2 mounts at data-slot="sky-descent"). Static and fully visible without JavaScript: the poster is the
 * LCP image (preloaded, data-hero-image), the Shiv Shiva wordmark is set in the display serif and a single
 * statement follows. Text sits on paper, never over the photograph, so contrast holds in both themes.
 *
 * Hooks for the Phase 2 sky descent: [data-hero-poster] wraps the image, [data-hero-wordmark] is the h1,
 * [data-hero-statement] the statement. Owner: pages-lead.
 */
import { Figure } from "@/components/media/Figure";
import { EnquireButton } from "@/components/ui/EnquireButton";
import { formatCoordinates } from "@/components/ui/map-links";
import { TextLink } from "@/components/ui/TextLink";
import { rich } from "@/components/ui/with-tbd";
import { heroCallouts } from "@/content/copy/callouts";
import { homeCopy } from "@/content/copy/home";
import { en } from "@/content/i18n/en";
import { getMedia } from "@/content/media";
import { shivShiva } from "@/content/projects";
import { site } from "@/content/site";

/** "Shiv Shiva Township" becomes the wordmark words ["Shiv", "Shiva"] and the suffix "Township". */
function splitName(name: string): { words: string[]; suffix: string } {
  const match = /^(.*?)\s+(Township)$/.exec(name);
  const base = match?.[1] ?? name;
  return { words: base.split(/\s+/), suffix: match?.[2] ?? "" };
}

export function Hero() {
  const poster = getMedia(shivShiva.heroMediaId);
  const { words, suffix } = splitName(shivShiva.name);
  const geo = site.contact.office.geo;

  return (
    <section id="top" data-slot="sky-descent" aria-labelledby="hero-title" className="relative border-b border-line">
      <div className="bg-grid">
        <div className="wrap pb-10 pt-8 md:pb-14 md:pt-12">
          <p className="t-mono flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-ink-muted">
            <span>{homeCopy.hero.eyebrow}</span>
            <span>{formatCoordinates(geo)}</span>
          </p>

          <h1 id="hero-title" data-hero-wordmark="" className="mt-7 md:mt-10">
            <span className="t-display-1 text-ink md:text-[clamp(7rem,16vw,17rem)]">
              {words.map((word, index) => (
                <span key={word} className="block md:inline">
                  {word}
                  {index < words.length - 1 ? <span className="hidden md:inline"> </span> : null}
                </span>
              ))}
            </span>
            {suffix ? (
              <span className="mt-3 block font-display text-[clamp(1.75rem,1.2rem+1.6vw,2.75rem)] italic leading-none text-brick-ink md:ml-4 md:inline-block">
                {suffix}
              </span>
            ) : null}
          </h1>

          <div className="mt-8 grid gap-8 md:mt-12 md:grid-cols-12 md:items-end md:gap-x-(--gutter)">
            <div className="md:col-span-7" data-hero-statement="">
              <p className="t-display-4 m-0 max-w-[34rem] text-ink">{rich(homeCopy.hero.statement)}</p>
              <p className="t-mono mt-4 text-ink-muted">{homeCopy.hero.by}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 md:col-span-5 md:justify-end">
              <EnquireButton size="lg">{en.enquiry.open}</EnquireButton>
              <TextLink href="/projects/shiv-shiva#plan" arrow="right">
                {en.common.explorePlan}
              </TextLink>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap pb-8 pt-2 md:pb-12" data-hero-poster="">
        <Figure
          media={poster}
          sizes="(min-width: 1408px) 1328px, calc(100vw - 2rem)"
          aspect={null}
          frameClassName="aspect-[3/2] md:aspect-[16/9] lg:aspect-[2/1]"
          objectPosition="50% 60%"
          preload
          quality={75}
          marks
          callouts={heroCallouts}
          calloutsDesktopOnly
          caption={homeCopy.hero.posterCaption}
          imageData={{ "data-hero-image": "" }}
        />
      </div>
    </section>
  );
}
