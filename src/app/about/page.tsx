/**
 * About. Owner: pages-lead. Facts only: the developer of Shiv Shiva Township and the one known milestone. The
 * company story, values and leadership stay hidden until they are supplied; a short honest line says more will
 * follow. Nothing here is invented.
 */
import type { Metadata } from "next";
import { Figure } from "@/components/media/Figure";
import { FactsBlock } from "@/components/project/FactsBlock";
import { Eyebrow } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import { TbdValue, rich } from "@/components/ui/with-tbd";
import { aboutCopy } from "@/content/copy/about";
import { en } from "@/content/i18n/en";
import { getMedia } from "@/content/media";
import { shivShiva } from "@/content/projects";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: aboutCopy.metaTitle,
  description: aboutCopy.metaDescription,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const image = getMedia("cover");
  const facts = aboutCopy.facts;
  const started = shivShiva.started;

  return (
    <>
      <section aria-labelledby="about-title" className="border-b border-line bg-grid">
        <div className="wrap pb-14 pt-10 md:pb-20 md:pt-16">
          <Eyebrow index="01">{aboutCopy.eyebrow}</Eyebrow>
          <h1 id="about-title" className="t-display-2 mt-8 max-w-[18ch] text-ink md:mt-12">
            {rich(aboutCopy.intro)}
          </h1>
          <p className="t-lead mt-8 max-w-[34rem] text-ink-muted">{rich(aboutCopy.body)}</p>
        </div>
      </section>

      <section aria-labelledby="about-facts-title" className="section-pad">
        <div className="wrap grid gap-12 lg:grid-cols-12 lg:gap-x-(--gutter)">
          <div className="lg:col-span-6">
            <h2 id="about-facts-title" className="t-mono m-0 mb-5 text-ink-muted">
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
              frameClassName="aspect-[4/3]"
              marks
              caption
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="timeline-title" className="section-pad border-y border-line bg-paper-sunk">
        <div className="wrap">
          <Eyebrow index="02">{aboutCopy.timeline.eyebrow}</Eyebrow>
          <h2 id="timeline-title" className="t-display-2 mt-10 text-ink md:mt-14">
            {rich(aboutCopy.timeline.heading)}
          </h2>

          <ol className="m-0 mt-12 grid list-none gap-0 p-0 md:mt-16" aria-label={aboutCopy.timeline.eyebrow}>
            {started !== "TBD" ? (
              <li className="relative grid gap-3 border-l border-line-strong pb-12 pl-8 md:grid-cols-[12rem_1fr] md:gap-10 md:pl-12" data-milestone={started}>
                <span aria-hidden="true" className="absolute -left-[7px] top-2 size-3.5 rounded-full border border-ink bg-brick" />
                <span aria-hidden="true" className="font-display text-[clamp(2.5rem,2rem+2vw,4rem)] leading-none text-ink [font-variant-numeric:lining-nums]">{started}</span>
                <p className="t-lead m-0 text-ink">{aboutCopy.timeline.milestone(started, shivShiva.name)}</p>
              </li>
            ) : null}
            <li className="relative border-l border-dashed border-line-strong pb-2 pl-8 md:pl-12">
              <span aria-hidden="true" className="absolute -left-[7px] top-2 size-3.5 rounded-full border border-dashed border-line-strong bg-paper" />
              <p className="t-small m-0 max-w-[34rem] text-ink-muted">{aboutCopy.timeline.more}</p>
            </li>
          </ol>
        </div>
      </section>

      <section aria-labelledby="reading-title" className="section-pad">
        <div className="wrap grid gap-12 lg:grid-cols-12 lg:gap-x-(--gutter)">
          <div className="lg:col-span-5">
            <Eyebrow index="03">{aboutCopy.reading.eyebrow}</Eyebrow>
            <h2 id="reading-title" className="t-display-2 mt-10 text-ink md:mt-14">
              {aboutCopy.reading.heading}
            </h2>
          </div>
          <ul className="m-0 grid list-none gap-0 border-t border-line-strong p-0 lg:col-span-7 lg:col-start-6 lg:mt-24">
            {aboutCopy.reading.items.map((item) => (
              <li key={item.title} className="grid gap-2 border-b border-line py-6 md:grid-cols-[11rem_1fr] md:gap-8">
                <h3 className="t-mono m-0 text-ink">{item.title === "TBD" ? rich("TBD") : item.title}</h3>
                <p className="m-0 text-ink-muted">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="more-title" className="section-pad border-t border-line pt-0">
        <div className="wrap">
          <div className="border border-dashed border-line-strong p-6 md:p-10">
            <p className="t-mono m-0 text-ink-muted">{aboutCopy.more.eyebrow}</p>
            <h2 id="more-title" className="t-display-3 mt-3 max-w-[26ch] text-ink">
              {aboutCopy.more.heading}
            </h2>
            <p className="mb-0 mt-4 max-w-[36rem] text-ink-muted">{aboutCopy.more.text}</p>
            <p className="mt-6">
              <TextLink href="/contact" arrow="right">
                {en.nav.contact}
              </TextLink>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
