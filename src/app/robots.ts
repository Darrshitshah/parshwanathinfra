/** robots.txt. Owner: pages-lead. The dev-only motion lab and the API are kept out of the index. */
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/components/seo/site-origin";

const DISALLOWED_PATHS = ["/motion-lab", "/api/"] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...DISALLOWED_PATHS] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
