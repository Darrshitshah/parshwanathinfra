/**
 * Project detail page. Owner: pages-lead. Statically generated for every visible project (only Shiv Shiva today);
 * any other slug is a 404.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectView } from "@/components/project/ProjectView";
import { getProject, projectIndex } from "@/content/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return projectIndex.filter((entry) => entry.visible).map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: { absolute: project.seo.title },
    description: project.seo.description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: project.seo.title,
      description: project.seo.description,
      type: "website",
      locale: "en_IN",
    },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return <ProjectView project={project} />;
}
