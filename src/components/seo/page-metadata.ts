/**
 * Per-page metadata builder. Owner: pages-lead. A page that sets `openGraph` or `twitter` replaces the root layout's
 * value wholesale, so every page goes through this one function and always carries a complete set: title,
 * description, canonical, Open Graph and a large-image Twitter card. One share card serves the whole site: the static
 * JPEG `app/opengraph-image.jpg` (built by tools/og/build-og-card.mjs). Home gets it through Next's file convention
 * (hashed URL, plus og:image:type); every other route names it explicitly below, because a page that sets `openGraph`
 * replaces the layout's value wholesale and would lose the inherited image.
 */
import type { Metadata } from "next";
import { seoCopy } from "@/content/copy/seo";
import { site } from "@/content/site";

/** The share card: the static file app/opengraph-image.jpg, served at this path. Size and type match that file. */
const DEFAULT_IMAGE = { url: "/opengraph-image.jpg", type: "image/jpeg", width: 1200, height: 630, alt: seoCopy.og.homeAlt } as const;

interface PageMetadataInput {
  title: string;
  description: string;
  /** Route path, e.g. "/about". Resolved against `metadataBase` by Next. */
  path: string;
  /** True when `title` is already the full title and must not get the " · Parshwanath Infra" suffix. */
  absoluteTitle?: boolean;
  /**
   * False only for Home, which owns the `opengraph-image` and `twitter-image` files: Next attaches those (with a
   * cache-busting hash) and a second explicit image would duplicate them. True (default) for every other route.
   */
  useDefaultImage?: boolean;
}

export function pageMetadata({ title, description, path, absoluteTitle = false, useDefaultImage = true }: PageMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} · ${site.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: site.name,
      locale: "en_IN",
      title: fullTitle,
      description,
      ...(useDefaultImage ? { images: [DEFAULT_IMAGE] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(useDefaultImage ? { images: [DEFAULT_IMAGE] } : {}),
    },
  };
}
