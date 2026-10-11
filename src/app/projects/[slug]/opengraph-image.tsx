/**
 * Project Open Graph image. Owner: pages-lead. The township boundary drawn from the layout plan (no render, so no
 * artist's-impression label is needed). Generated once per visible project at build time.
 */
import { notFound } from "next/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/components/seo/og-card";
import { seoCopy } from "@/content/copy/seo";
import { getProject, projectIndex } from "@/content/projects";

export const alt = seoCopy.og.projectAlt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return projectIndex.filter((entry) => entry.visible).map((entry) => ({ slug: entry.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return renderOgImage(project, { kind: "plan" });
}
