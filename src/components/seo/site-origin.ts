/**
 * Public origin of the site. Owner: pages-lead. Reads the same variable as the root layout's `metadataBase` so
 * canonical URLs, the sitemap, robots and JSON-LD all agree. The domain is not decided yet: until
 * NEXT_PUBLIC_SITE_URL is set (Vercel project settings) everything points at localhost.
 */
const FALLBACK_ORIGIN = "http://localhost:3000";

/** NEXT_PUBLIC_SITE_URL wins; on Vercel without it, the project's production URL (then the deployment URL). */
export function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  return vercelHost ? `https://${vercelHost.replace(/\/+$/, "")}` : FALLBACK_ORIGIN;
}

/** `/projects` becomes `https://example.com/projects`; `/` becomes `https://example.com` (as Next writes the home canonical). */
export function absoluteUrl(path: string): string {
  const url = new URL(path, `${siteOrigin()}/`).toString();
  return path === "/" ? url.replace(/\/$/, "") : url;
}
