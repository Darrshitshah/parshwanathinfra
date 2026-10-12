/**
 * Projects index. Owner: pages-lead. Shiv Shiva Township only: any other project appears here only when real data
 * exists in src/content/projects (visibleProjects reads it). Each project is a large feature, not a grid cell.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Figure } from "@/components/media/Figure";
import { FactsBlock } from "@/components/project/FactsBlock";
import { pageMetadata } from "@/components/seo/page-metadata";
import { Eyebrow } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import { TbdValue, rich } from "@/components/ui/with-tbd";
import { projectsIndexCopy } from "@/content/copy/project";
import { getMedia } from "@/content/media";
import { visibleProjects } from "@/content/projects";

export const metadata: Metadata = pageMetadata({
  title: projectsIndexCopy.metaTitle,
  description: projectsIndexCopy.metaDescription,
  path: "/projects",
});

export default function ProjectsPage() {
  const projects = visibleProjects();

  return (
    <>
      <section aria-labelledby="projects-title" className="tone-paper">
        <div className="wrap pb-[calc(var(--sheet-r)+4rem)] pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+5rem)]">
          <Eyebrow index="01">{projectsIndexCopy.eyebrow}</Eyebrow>
          <h1 id="projects-title" className="t-display-1 mt-10 text-ink md:mt-14 md:text-[clamp(7rem,15vw,15rem)]">
            {projectsIndexCopy.title}
          </h1>
          <p className="t-lead mt-8 max-w-[28rem] text-ink-muted">{projectsIndexCopy.intro}</p>
        </div>
      </section>

      <section aria-label={projectsIndexCopy.title} className="tone-mist sheet">
        <div className="wrap grid gap-24 md:gap-32">
          {projects.map((project, index) => {
            const poster = getMedia(project.heroMediaId);
            const href = `/projects/${project.slug}`;
            const offering = project.offering.map((item) => item.label).join(" · ");
            return (
              <article key={project.slug} data-project={project.slug} className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-x-(--gutter)">
                <Link href={href} tabIndex={-1} aria-hidden="true" className="group block lg:col-span-5">
                  <Figure
                    media={poster}
                    sizes="(min-width: 1408px) 560px, (min-width: 1024px) 42vw, calc(100vw - 2rem)"
                    aspect={null}
                    shape="arch"
                    frameClassName="aspect-[4/5]"
                    imageClassName="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.025]"
                    decorative
                  />
                </Link>
                <div className="lg:col-span-6 lg:col-start-7">
                  <p className="t-mono mb-6 flex items-center gap-3 text-ink-muted">
                    <span className="eyebrow__marker" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {index === 0 ? projectsIndexCopy.flagship : null}
                  </p>
                  <h2 className="t-display-2 m-0 text-ink md:text-[clamp(3rem,1.5rem+5vw,6.5rem)]">
                    <Link href={href} className="link-draw link-draw--quiet">
                      {project.name}
                    </Link>
                  </h2>
                  <p className="t-lead mt-5 text-ink-muted">{rich(project.summary)}</p>
                  <FactsBlock
                    className="mt-10"
                    columns={1}
                    facts={[
                      { label: projectsIndexCopy.facts.status, value: project.status },
                      {
                        label: projectsIndexCopy.facts.started,
                        value: <TbdValue value={project.started}>{(year) => String(year)}</TbdValue>,
                      },
                      { label: projectsIndexCopy.facts.offering, value: offering },
                    ]}
                  />
                  <p className="mt-8">
                    <TextLink href={href} arrow="right">
                      {projectsIndexCopy.open}
                    </TextLink>
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
