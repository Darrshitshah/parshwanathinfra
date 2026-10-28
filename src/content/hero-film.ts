/**
 * Hero film data, read at build time from public/video/hero/manifest.json (written by tools/imagegen/assemble_hero.py)
 * and validated with zod. A server-side module: the player gets the small `HeroFilmData` it returns, never the manifest
 * itself and never a client fetch. If the manifest is malformed the build fails loudly instead of shipping a broken hero.
 *
 * The manifest also names an image sequence (the frame folder under public/sequences). It is deliberately NOT used: the
 * film plays as video, and the frames stay on disk as the scroll-scrub alternative until Darshit asks for it.
 */
import { z } from "zod";
import manifestJson from "../../public/video/hero/manifest.json";
import type { FilmCutFiles, FilmPoster, FilmSource, HeroFilmData } from "@/lib/hero-film";

const publicPath = z
  .string()
  .regex(/^\/video\/hero\/[a-z0-9-]+\.(avif|webp|mp4|webm)$/, "must be a /video/hero/ file path");

const dimension = z.number().int().positive();

const imageFile = z.object({ src: publicPath, width: dimension, height: dimension, bytes: dimension });
const posterFile = imageFile.extend({ avif: imageFile });

const videoFile = z.object({
  src: publicPath,
  bytes: dimension,
  width: dimension,
  height: dimension,
  durationSeconds: z.number().positive(),
});

const encodes = z.object({ webm: videoFile, mp4: videoFile });

const cut = z.object({
  durationSeconds: z.number().positive(),
  files: z.object({ desktop: encodes, mobile: encodes }),
});

export const heroManifestSchema = z.object({
  alt: z.string().min(20),
  artistImpression: z.boolean(),
  poster: posterFile.extend({ start: posterFile }),
  cuts: z.object({ full: cut, short: cut }),
});

export type HeroManifest = z.infer<typeof heroManifestSchema>;

function toPoster(file: z.infer<typeof posterFile>): FilmPoster {
  return { avif: file.avif.src, webp: file.src, width: file.avif.width, height: file.avif.height };
}

function toSources(files: z.infer<typeof encodes>): readonly FilmSource[] {
  // WebM (VP9) first: it is smaller at the same quality; the browser skips it if it cannot decode it.
  return [
    { src: files.webm.src, type: 'video/webm; codecs="vp9"' },
    { src: files.mp4.src, type: "video/mp4" },
  ];
}

function toCut(source: z.infer<typeof cut>): FilmCutFiles {
  return {
    durationSeconds: source.durationSeconds,
    mobile: toSources(source.files.mobile),
    desktop: toSources(source.files.desktop),
  };
}

/** Pure and exported for tests: validates any manifest-shaped value and returns what the player needs. */
export function parseHeroFilm(input: unknown): HeroFilmData {
  const manifest = heroManifestSchema.parse(input);
  return {
    alt: manifest.alt,
    artistImpression: manifest.artistImpression,
    posters: { start: toPoster(manifest.poster.start), final: toPoster(manifest.poster) },
    cuts: { short: toCut(manifest.cuts.short), full: toCut(manifest.cuts.full) },
  };
}

export const heroFilm: HeroFilmData = parseHeroFilm(manifestJson);
