/**
 * Project page hero: the name in the uppercase display serif with one script word, the one-line summary, the three
 * facts that are always known (developer, status, start year) and the main-road corner render standing in an arch. The name reveals in Phase 2
 * (hook: [data-hero-wordmark]). The image is the LCP element: preloaded and marked data-hero-image. Owner: pages-lead.
 */
import Link from "next/link";
import { Magnetic } from "@/components/cursor";
import { Figure } from "@/components/media/Figure";
import { EnquireButton } from "@/components/ui/EnquireButton";
import { TextLink } from "@/components/ui/TextLink";
import { TbdValue, rich } from "@/components/ui/with-tbd";
import { projectCopy } from "@/content/copy/project";
import { en } from "@/content/i18n/en";
import { getMedia } from "@/content/media";
import type { Project } from "@/content/schema";
import { FactsBlock } from "./FactsBlock";

/** "Shiv Shiva Township" becomes the wordmark words ["Shiv", "Shiva"] and the suffix "Township". */
function splitName(name: string): { words: string[]; suffix: string } {
  const match = /^(.*?)\s+(Township)$/.exec(name);
  const base = match?.[1] ?? name;
  return { words: base.split(/\s+/), suffix: match?.[2] ?? "" };
}

/** Phones get the 640 px file (about 1.95x at 2x density), not the 960 px one: fewer bytes on the LCP path. */
const POSTER_SIZES = "(min-width: 1408px) 664px, (min-width: 1024px) 46vw, (min-width: 640px) calc(100vw - 2rem), 320px";

export function ProjectHero({ project }: { project: Project }) {
  const poster = getMedia("cover");
  const { words, suffix } = splitName(project.name);
  const facts = projectCopy.hero.facts;

  return (
    <section id="top" aria-labelledby="project-title" className="tone-paper relative">
      <div className="wrap grid gap-12 pb-[calc(var(--sheet-r)+3rem)] pt-[calc(var(--header-h)+2.5rem)] lg:grid-cols-12 lg:gap-x-(--gutter) lg:pt-[calc(var(--header-h)+3.5rem)]">
        <div className="flex flex-col lg:col-span-6">
          <nav aria-label={projectCopy.breadcrumbLabel}>
            <ol className="t-mono-sm m-0 flex list-none flex-wrap items-center gap-x-3 gap-y-1 p-0 text-ink-muted">
              <li>
                <Link href="/projects" className="link-draw link-draw--quiet">
                  {projectCopy.breadcrumbProjects}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">
                {project.name}
              </li>
            </ol>
          </nav>

          <h1 id="project-title" data-hero-wordmark="" className="mt-10 md:mt-12">
            <span className="t-display-1 block text-ink md:text-[clamp(6rem,10.5vw,11.5rem)]">
              {words.map((word) => (
                <span key={word} className="block">
                  {word}
                </span>
              ))}
            </span>
            {suffix ? <span className="hero-script hero-script--plain">{suffix}</span> : null}
          </h1>

          <p className="t-lead mt-10 max-w-[30rem] text-ink-muted">{rich(project.summary)}</p>

          <FactsBlock
            className="mt-12 lg:mt-auto lg:pt-12"
            columns={3}
            facts={[
              { label: facts.developer, value: project.developer },
              { label: facts.status, value: project.status },
              { label: facts.started, value: <TbdValue value={project.started}>{(year) => String(year)}</TbdValue> },
            ]}
          />

          <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-5">
            <Magnetic>
              <EnquireButton size="lg">{en.enquiry.open}</EnquireButton>
            </Magnetic>
            <TextLink href="#plan" arrow="right" className="t-mono-sm">
              {en.common.explorePlan}
            </TextLink>
          </div>
        </div>

        <div className="lg:col-span-6" data-hero-poster="">
          <Figure
            media={poster}
            sizes={POSTER_SIZES}
            aspect={null}
            shape="arch"
            frameClassName="aspect-[4/5]"
            objectPosition="62% 50%"
            preload
            caption={projectCopy.hero.posterCaption}
            imageData={{ "data-hero-image": "" }}
          />
        </div>
      </div>
    </section>
  );
}
