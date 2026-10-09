/**
 * Project list. Owner: data-lead. Only Shiv Shiva is known; other projects stay out until real data exists.
 */
import { projectIndexSchema, type Project, type ProjectIndex } from "../schema";
import { shivShiva } from "./shiv-shiva";

export const projectIndex: ProjectIndex = projectIndexSchema.parse([
  { slug: "shiv-shiva", name: "Shiv Shiva Township", visible: true, flagship: true },
]);

const projects: Record<string, Project> = { "shiv-shiva": shivShiva };

export function getProject(slug: string): Project | undefined {
  return projects[slug];
}

export function visibleProjects(): Project[] {
  return projectIndex.filter((entry) => entry.visible).flatMap((entry) => projects[entry.slug] ?? []);
}

export { shivShiva };
