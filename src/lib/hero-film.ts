/**
 * Hero film: which poster and which video files a visitor gets. Pure logic, safe on the server and in the browser; the
 * manifest is read and validated in `src/content/hero-film.ts`, the player is `src/components/home/HeroFilm.tsx`.
 *
 * Rules (Darshit, 2026-10-28): short cut on phones, full cut on desktop; webm first, then mp4; reduced motion, Save-Data
 * and Tier C get the final poster only. The film plays once and holds its last frame (the finished township).
 */
import type { Tier } from "./device-tier";

export type FilmCut = "short" | "full";
export type FilmVariant = "mobile" | "desktop";
export type PosterKind = "start" | "final";

/** Phones and small tablets: the short cut with the 720p encodes. Wider viewports get the full cut at 1080p. */
export const NARROW_VIEWPORT_QUERY = "(max-width: 767px)";

export interface FilmSource {
  src: string;
  /** MIME type for the `<source type>` attribute; the browser skips a source it cannot decode. */
  type: string;
}

export interface FilmPoster {
  avif: string;
  webp: string;
  width: number;
  height: number;
}

export interface FilmCutFiles {
  durationSeconds: number;
  /** Ordered for playback: webm first, then mp4. */
  mobile: readonly FilmSource[];
  desktop: readonly FilmSource[];
}

/** What the server hands to the client player. Small and serialisable on purpose. */
export interface HeroFilmData {
  alt: string;
  artistImpression: boolean;
  posters: { start: FilmPoster; final: FilmPoster };
  cuts: { short: FilmCutFiles; full: FilmCutFiles };
}

export interface FilmEnvironment {
  /** False on the server and before the first client effect (the device tier is not known yet). */
  ready: boolean;
  tier: Tier;
  reducedMotion: boolean;
  saveData: boolean;
  /** True when the viewport matches NARROW_VIEWPORT_QUERY. */
  narrow: boolean;
}

export type PosterOnlyReason = "not-ready" | "reduced-motion" | "save-data" | "tier-c";

export type FilmPlayback =
  | { mode: "poster"; poster: PosterKind; reason: PosterOnlyReason }
  | { mode: "film"; poster: "start"; cut: FilmCut; variant: FilmVariant; sources: readonly FilmSource[] };

/**
 * Why the film must not load, or null when it may. Reduced motion and Save-Data are checked before the tier so the
 * reason is the visitor's own setting, not the derived Tier C.
 */
export function posterOnlyReason(env: Pick<FilmEnvironment, "ready" | "tier" | "reducedMotion" | "saveData">): PosterOnlyReason | null {
  if (env.reducedMotion) return "reduced-motion";
  if (env.saveData) return "save-data";
  if (!env.ready) return "not-ready";
  if (env.tier === "C") return "tier-c";
  return null;
}

export function pickCut(narrow: boolean): { cut: FilmCut; variant: FilmVariant } {
  return narrow ? { cut: "short", variant: "mobile" } : { cut: "full", variant: "desktop" };
}

/**
 * Before the device is known the start frame is shown (the film then fades in from an identical frame, and a
 * `prefers-reduced-motion` source swaps in the final frame without waiting for scripts). Every static mode that is
 * known shows the final frame, the finished township.
 */
export function selectHeroPlayback(film: HeroFilmData, env: FilmEnvironment): FilmPlayback {
  const reason = posterOnlyReason(env);
  if (reason !== null) {
    return { mode: "poster", poster: reason === "not-ready" ? "start" : "final", reason };
  }
  const { cut, variant } = pickCut(env.narrow);
  return { mode: "film", poster: "start", cut, variant, sources: film.cuts[cut][variant] };
}
