/**
 * Project page hero: the name in the display serif, the one-line summary, the three facts that are always known
 * (developer, status, start year) and a tall plate of the main-road corner render. The name reveals in Phase 2
 * (hook: [data-hero-wordmark]). The image is the LCP element: preloaded and marked data-hero-image. Owner: pages-lead.
 */
import Link from "next/link";
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

export function ProjectHero({ project }: { project: Project }) {
  const poster = getMedia("cover");
  const { words, suffix } = splitName(project.name);
  const facts = projectCopy.hero.facts;

  return (
    <section id="top" aria-labelledby="project-title" className="border-b border-line">
      <div className="wrap grid gap-10 pb-12 pt-8 md:pt-12 lg:grid-cols-12 lg:gap-x-(--gutter) lg:pb-16">
        <div className="flex flex-col lg:col-span-6">
          <nav aria-label={projectCopy.breadcrumbLabel}>
            <ol className="t-mono m-0 flex list-none flex-wrap items-center gap-x-3 gap-y-1 p-0 text-ink-muted">
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

          <h1 id="project-title" data-hero-wordmark="" className="mt-8 md:mt-10">
            <span className="t-display-1 text-ink md:text-[clamp(6rem,9.5vw,10rem)]">
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

          <p className="t-lead mt-8 max-w-[32rem] text-ink-muted">{rich(project.summary)}</p>

          <FactsBlock
            className="mt-10 lg:mt-auto"
            columns={3}
            facts={[
              { label: facts.developer, value: project.developer },
              { label: facts.status, value: project.status },
              { label: facts.started, value: <TbdValue value={project.started}>{(year) => String(year)}</TbdValue> },
            ]}
          />

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <EnquireButton size="lg">{en.enquiry.open}</EnquireButton>
            <TextLink href="#plan" arrow="right">
              {en.common.explorePlan}
            </TextLink>
          </div>
        </div>

        <div className="lg:col-span-6" data-hero-poster="">
          <Figure
            media={poster}
            sizes="(min-width: 1408px) 664px, (min-width: 1024px) 46vw, calc(100vw - 2rem)"
            aspect={null}
            frameClassName="aspect-[3/2] lg:aspect-[4/5]"
            objectPosition="62% 50%"
            preload
            marks
            caption={projectCopy.hero.posterCaption}
            imageData={{ "data-hero-image": "" }}
          />
        </div>
      </div>
    </section>
  );
}
