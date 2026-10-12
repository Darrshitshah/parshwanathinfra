/**
 * "Walk the township": the still image and the route (S4 diorama mounts at data-slot="diorama"), on a forest colour
 * block. The still is a full-bleed aerial; below it the route is six numbered stations that mirror the Living Plan chapters. It
 * is complete on its own for visitors who never get the 3D model. The figure is the fallback of `DioramaMount`, which
 * swaps in the diorama near the viewport. Owner: pages-lead.
 */
import { Figure } from "@/components/media/Figure";
import { Eyebrow } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import { rich } from "@/components/ui/with-tbd";
import { homeCopy } from "@/content/copy/home";
import { en } from "@/content/i18n/en";
import { getMedia } from "@/content/media";
import { DioramaMount } from "./DioramaMount";

export function Diorama() {
  const still = getMedia("masterplan-full");
  const { stops } = homeCopy.walk;

  return (
    <section id="walk" data-slot="diorama" aria-labelledby="walk-title" className="tone-ink sheet">
      <div className="wrap">
        <Eyebrow index="04" note={homeCopy.walk.note}>
          {homeCopy.walk.eyebrow}
        </Eyebrow>
        <div className="mt-10 grid gap-8 md:mt-14 lg:grid-cols-12 lg:gap-x-(--gutter)">
          <h2 id="walk-title" className="t-display-2 text-ink lg:col-span-6">
            {rich(homeCopy.walk.heading)}
          </h2>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="t-lead m-0 text-ink-muted">{rich(homeCopy.walk.body)}</p>
            <p className="mt-8">
              <TextLink href="/projects/shiv-shiva#plan" arrow="right">
                {en.common.explorePlan}
              </TextLink>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 md:mt-16">
        <DioramaMount>
          <div data-fallback="static">
            <Figure
              media={still}
              sizes="100vw"
              aspect={null}
              shape="bleed"
              frameClassName="aspect-[4/3] md:aspect-[16/8] lg:aspect-[21/9]"
              objectPosition="50% 55%"
              caption={<span className="wrap block">{homeCopy.walk.stillCaption}</span>}
            />
          </div>
        </DioramaMount>
      </div>

      <div className="wrap mt-14 md:mt-20">
        <p className="t-mono-sm m-0 mb-8 text-ink-muted">{homeCopy.walk.routeLabel}</p>
        <ol className="m-0 grid list-none gap-x-8 gap-y-12 p-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6" aria-label={homeCopy.walk.routeLabel}>
          {stops.map((stop, index) => (
            <li key={stop.id} data-route-stop={stop.id}>
              <span className="font-display text-[clamp(2.75rem,2rem+2.4vw,4.25rem)] font-medium leading-none text-brick-ink [font-variant-numeric:lining-nums]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="t-display-4 m-0 mt-4 text-ink">{stop.title}</h3>
              <p className="t-small mb-0 mt-3 text-ink-muted">{rich(stop.text)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
