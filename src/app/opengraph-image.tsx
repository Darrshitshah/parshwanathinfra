/**
 * Default Open Graph image: inherited by every route that has no image of its own. Owner: pages-lead. The masterplan
 * render, labelled "Artist's impression". Generated once at build time.
 */
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/components/seo/og-card";
import { seoCopy } from "@/content/copy/seo";
import { shivShiva } from "@/content/projects";

export const alt = seoCopy.og.homeAlt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage(shivShiva, { kind: "render", mediaId: shivShiva.seo.ogMediaId ?? shivShiva.heroMediaId });
}
