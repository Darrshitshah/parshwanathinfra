/** Sitemap of the public routes only (src/components/seo/routes.ts). Owner: pages-lead. No dates are invented. */
import type { MetadataRoute } from "next";
import { publicPaths } from "@/components/seo/routes";
import { absoluteUrl } from "@/components/seo/site-origin";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths().map((path) => ({ url: absoluteUrl(path) }));
}
