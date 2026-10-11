/**
 * Per-page metadata builder. Owner: pages-lead. A page that sets `openGraph` or `twitter` replaces the root layout's
 * value wholesale, so every page goes through this one function and always carries a complete set: title,
 * description, canonical, Open Graph and a large-image Twitter card. The Open Graph image itself comes from the
 * `opengraph-image` file nearest the route (Home's, or the project's), which Next adds to `openGraph.images`.
 */
import type { Metadata } from "next";
import { seoCopy } from "@/content/copy/seo";
import { site } from "@/content/site";

/** The default card, built by app/opengraph-image.tsx. Same size as that file exports. */
const DEFAULT_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: seoCopy.og.homeAlt } as const;

interface PageMetadataInput {
  title: string;
  description: string;
  /** Route path, e.g. "/about". Resolved against `metadataBase` by Next. */
  path: string;
  /** True when `title` is already the full title and must not get the " · Parshwanath Infra" suffix. */
  absoluteTitle?: boolean;
  /**
   * False for routes that own an `opengraph-image` file (Home, the project page): Next attaches that file's image.
   * True (default) for the rest: a page that sets `openGraph` replaces the layout's wholesale and would lose the
   * inherited image, so the default card is named explicitly.
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
