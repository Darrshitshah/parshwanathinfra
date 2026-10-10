/**
 * "Walk the township": the still image and the route (S4 diorama mounts at data-slot="diorama"). The still is a
 * full-bleed aerial; below it the route is a numbered line of stations that mirrors the Living Plan chapters. It
 * is complete on its own for visitors who never get the 3D model. Owner: pages-lead.
 */
import { Figure } from "@/components/media/Figure";
import { Eyebrow } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import { rich } from "@/components/ui/with-tbd";
import { homeCopy } from "@/content/copy/home";
import { en } from "@/content/i18n/en";
import { getMedia } from "@/content/media";

export function Diorama() {
  const still = getMedia("masterplan-full");
  const { stops } = homeCopy.walk;

  return (
    <section id="walk" data-slot="diorama" aria-labelledby="walk-title" className="section-pad">
      <div className="wrap">
        <Eyebrow index="04" note={homeCopy.walk.note}>
          {homeCopy.walk.eyebrow}
        </Eyebrow>
        <div className="mt-10 grid gap-8 md:mt-14 lg:grid-cols-12 lg:gap-x-(--gutter)">
          <h2 id="walk-title" className="t-display-2 text-ink lg:col-span-6">
            {homeCopy.walk.heading}
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

      <div className="mt-12 md:mt-16" data-fallback="static">
        <Figure
          media={still}
          sizes="100vw"
          aspect={null}
          frameClassName="aspect-[4/3] md:aspect-[16/8] lg:aspect-[21/9]"
          objectPosition="50% 55%"
          caption={<span className="wrap block">{homeCopy.walk.stillCaption}</span>}
        />
      </div>

      <div className="wrap mt-14 md:mt-20">
        <p className="t-mono-sm m-0 mb-6 text-ink-muted">{homeCopy.walk.routeLabel}</p>
        <ol className="m-0 grid list-none gap-0 p-0 max-md:ml-1.5 max-md:border-l max-md:border-line-strong md:grid-cols-3 md:border-t md:border-line-strong lg:grid-cols-6" aria-label={homeCopy.walk.routeLabel}>
          {stops.map((stop, index) => (
            <li key={stop.id} data-route-stop={stop.id} className="relative max-md:pb-8 max-md:pl-7 md:pb-4 md:pr-6 md:pt-8">
              <span
                aria-hidden="true"
                className="absolute size-3 rounded-full border border-ink bg-paper max-md:-left-[6.5px] max-md:top-1.5 md:-top-[6.5px] md:left-0"
              />
              <span className="t-mono-sm text-ink-muted">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="t-display-4 m-0 mt-2 text-ink">{stop.title}</h3>
              <p className="t-small mb-0 mt-2 text-ink-muted">{rich(stop.text)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
