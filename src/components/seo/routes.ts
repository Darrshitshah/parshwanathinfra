/**
 * The public, indexable routes: the single list the sitemap is built from (and the tests check). Anything not here
 * (/motion-lab, /api) is deliberately absent. Project pages come from the content layer, so a project that is not
 * visible never appears.
 */
import { visibleProjects } from "@/content/projects";

const STATIC_PATHS = ["/", "/projects", "/about", "/contact", "/privacy", "/terms", "/disclaimer"] as const;

export function projectPath(slug: string): string {
  return `/projects/${slug}`;
}

export function publicPaths(): string[] {
  const projectPaths = visibleProjects().map((project) => projectPath(project.slug));
  return [...STATIC_PATHS.slice(0, 2), ...projectPaths, ...STATIC_PATHS.slice(2)];
}
