/**
 * About. Owner: pages-lead. Facts only: the developer of Shiv Shiva Township and the one known milestone. The
 * company story, values and leadership stay hidden until they are supplied; a short honest line says more will
 * follow. Nothing here is invented.
 */
import type { Metadata } from "next";
import { Figure } from "@/components/media/Figure";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/components/seo/page-metadata";
import { FactsBlock } from "@/components/project/FactsBlock";
import { Eyebrow } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import { TbdValue, rich } from "@/components/ui/with-tbd";
import { aboutCopy } from "@/content/copy/about";
import { en } from "@/content/i18n/en";
import { getMedia } from "@/content/media";
import { shivShiva } from "@/content/projects";
import { site } from "@/content/site";

export const metadata: Metadata = pageMetadata({
  title: aboutCopy.metaTitle,
  description: aboutCopy.metaDescription,
  path: "/about",
});

export default function AboutPage() {
  const image = getMedia("cover");
  const facts = aboutCopy.facts;
  const started = shivShiva.started;

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <section aria-labelledby="about-title" className="tone-paper">
        <div className="wrap pb-[calc(var(--sheet-r)+4rem)] pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+5rem)]">
          <Eyebrow index="01">{aboutCopy.eyebrow}</Eyebrow>
          <h1 id="about-title" className="t-display-2 mt-10 max-w-[16ch] text-ink md:mt-14 md:text-[clamp(3rem,1.2rem+6vw,7.5rem)]">
            {rich(aboutCopy.intro)}
          </h1>
          <p className="t-lead mt-10 max-w-[34rem] text-ink-muted">{rich(aboutCopy.body)}</p>
        </div>
      </section>

      <section aria-labelledby="about-facts-title" className="tone-jewel sheet">
        <div className="wrap grid gap-16 lg:grid-cols-12 lg:items-center lg:gap-x-(--gutter)">
          <div className="lg:col-span-6">
            <h2 id="about-facts-title" className="t-mono m-0 mb-8 text-ink-muted">
              {facts.eyebrow}
            </h2>
            <FactsBlock
              columns={2}
              facts={[
                { label: facts.developer, value: site.name },
                { label: facts.legalName, value: <TbdValue value={site.legalName} /> },
                { label: facts.flagship, value: <TextLink href="/projects/shiv-shiva">{shivShiva.name}</TextLink> },
                { label: facts.status, value: shivShiva.status },
                { label: facts.began, value: <TbdValue value={started}>{(year) => String(year)}</TbdValue> },
                { label: facts.office, value: <address className="not-italic">{rich(site.contact.office.address)}</address> },
              ]}
            />
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <Figure
              media={image}
              sizes="(min-width: 1408px) 560px, (min-width: 1024px) 40vw, calc(100vw - 2rem)"
              aspect={null}
              shape="arch"
              frameClassName="aspect-[4/5]"
              caption
              captionClassName="text-ink-muted"
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="timeline-title" className="tone-paper sheet">
        <div className="wrap">
          <Eyebrow index="02">{aboutCopy.timeline.eyebrow}</Eyebrow>
          <h2 id="timeline-title" className="t-display-2 mt-10 text-ink md:mt-14">
            {rich(aboutCopy.timeline.heading)}
          </h2>

          <ol className="m-0 mt-14 grid list-none gap-12 p-0 md:mt-20" aria-label={aboutCopy.timeline.eyebrow}>
            {started !== "TBD" ? (
              <li className="grid items-baseline gap-3 md:grid-cols-[minmax(12rem,20rem)_1fr] md:gap-10" data-milestone={started}>
                <span aria-hidden="true" className="font-display text-[clamp(4rem,2rem+8vw,9rem)] font-medium leading-[0.85] text-brick-ink [font-variant-numeric:lining-nums]">{started}</span>
                <p className="t-lead m-0 max-w-[30rem] text-ink">{aboutCopy.timeline.milestone(started, shivShiva.name)}</p>
              </li>
            ) : null}
            <li className="md:grid md:grid-cols-[minmax(12rem,20rem)_1fr] md:gap-10">
              <span aria-hidden="true" className="hidden md:block" />
              <p className="t-small m-0 max-w-[34rem] text-ink-muted">{aboutCopy.timeline.more}</p>
            </li>
          </ol>
        </div>
      </section>

      <section aria-labelledby="reading-title" className="tone-mist sheet">
        <div className="wrap">
          <Eyebrow index="03">{aboutCopy.reading.eyebrow}</Eyebrow>
          <h2 id="reading-title" className="t-display-2 mt-10 max-w-[14ch] text-ink md:mt-14">
            {rich(aboutCopy.reading.heading)}
          </h2>
          <ul className="m-0 mt-14 grid list-none gap-5 p-0 md:mt-20 md:grid-cols-3">
            {aboutCopy.reading.items.map((item) => (
              <li key={item.title} className="rounded-(--radius-card) bg-paper-raised p-7 md:p-9">
                <h3 className="t-display-4 m-0 text-ink">{item.title === "TBD" ? rich("TBD") : item.title}</h3>
                <p className="mb-0 mt-4 text-ink-muted">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="more-title" className="tone-ink sheet">
        <div className="wrap">
          <p className="t-mono m-0 text-ink-muted">{aboutCopy.more.eyebrow}</p>
          <h2 id="more-title" className="t-display-3 mt-6 max-w-[22ch] text-ink">
            {rich(aboutCopy.more.heading)}
          </h2>
          <p className="mb-0 mt-6 max-w-[36rem] text-ink-muted">{aboutCopy.more.text}</p>
          <p className="mt-10">
            <TextLink href="/contact" arrow="right">
              {en.nav.contact}
            </TextLink>
          </p>
        </div>
      </section>
    </>
  );
}
