"use client";

/**
 * The hero's picture: a poster that is the LCP image, and, where the visitor's device and settings allow, the film
 * playing over it. Decorative video (aria-hidden, muted, no controls); the poster carries the alt text. The film plays
 * once and holds its last frame, the finished township. Rules and file choice: `src/lib/hero-film.ts`.
 *
 * Markup contract kept from the old hero: [data-hero-poster] wraps the picture, img[data-hero-image] is the preloaded
 * LCP image. The "Artist's impression" label (and the pause control) sit top left under the header: above the scrim,
 * and clear of the bottom edge, where the next section's sheet overlaps the hero.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui/cn";
import { en } from "@/content/i18n/en";
import { useDeviceTier } from "@/lib/device-tier-provider";
import { selectHeroPlayback, type HeroFilmData, type PosterKind } from "@/lib/hero-film";
import { useHeroFilmGate } from "./use-hero-film-gate";

/** Same crop for poster and film so the film fades in from an identical frame. */
const OBJECT_POSITION = "32% 55%";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type FilmStatus = "loading" | "playing" | "ended" | "failed";

function PosterPicture({ film, kind }: { film: HeroFilmData; kind: PosterKind }) {
  const poster = film.posters[kind];
  const finalPoster = film.posters.final;
  return (
    <picture>
      {kind === "start" ? (
        // Before scripts run the start frame is served; a reduced-motion visitor gets the final frame straight away.
        <>
          <source key="rm-avif" media={REDUCED_MOTION_QUERY} type="image/avif" srcSet={finalPoster.avif} />
          <source key="rm-webp" media={REDUCED_MOTION_QUERY} type="image/webp" srcSet={finalPoster.webp} />
        </>
      ) : null}
      <source key="avif" type="image/avif" srcSet={poster.avif} />
      <source key="webp" type="image/webp" srcSet={poster.webp} />
      {/* A plain img on purpose: the posters are already encoded (AVIF and WebP) and sized by the film pipeline. */}
      <img
        key="img"
        src={poster.webp}
        alt={film.alt}
        width={poster.width}
        height={poster.height}
        decoding="async"
        loading="eager"
        fetchPriority="high"
        data-hero-image=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: OBJECT_POSITION }}
      />
    </picture>
  );
}

export function HeroFilm({ film }: { film: HeroFilmData }) {
  const device = useDeviceTier();
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<FilmStatus>("loading");
  const [userPaused, setUserPaused] = useState(false);

  const environment = {
    ready: device.ready,
    tier: device.tier,
    reducedMotion: device.reducedMotion,
    saveData: device.saveData,
  };
  const eligible = selectHeroPlayback(film, { ...environment, narrow: false }).mode === "film";
  const gate = useHeroFilmGate(rootRef, eligible);
  const playback = selectHeroPlayback(film, { ...environment, narrow: gate.narrow ?? false });

  const filmMounted = playback.mode === "film" && gate.armed && status !== "failed";
  const posterKind: PosterKind = status === "failed" ? "final" : playback.poster;
  const shouldPlay = filmMounted && gate.visible && !userPaused && status !== "ended";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!shouldPlay) {
      video.pause();
      return;
    }
    video.muted = true;
    const attempt = video.play();
    attempt?.catch((error: unknown) => {
      // A pause() that interrupts play() is expected; anything else (autoplay blocked, no decodable source) falls
      // back to the poster.
      if (!(error instanceof DOMException && error.name === "AbortError")) setStatus("failed");
    });
  }, [shouldPlay]);

  const sources = playback.mode === "film" ? playback.sources : [];
  const showControl = filmMounted && (status === "loading" || status === "playing");
  const label = film.artistImpression ? en.common.artistsImpression : null;

  return (
    <>
      <div ref={rootRef} data-hero-poster="" data-film={filmMounted ? status : "off"} className="absolute inset-0 -z-20">
        <PosterPicture film={film} kind={posterKind} />
        {filmMounted ? (
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            disablePictureInPicture
            disableRemotePlayback
            data-hero-film=""
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out",
              status === "playing" || status === "ended" ? "opacity-100" : "opacity-0",
            )}
            style={{ objectPosition: OBJECT_POSITION }}
            onPlaying={() => setStatus("playing")}
            onEnded={() => setStatus("ended")}
          >
            {sources.map((source, index) => (
              <source
                key={source.src}
                src={source.src}
                type={source.type}
                onError={index === sources.length - 1 ? () => setStatus("failed") : undefined}
              />
            ))}
          </video>
        ) : null}
      </div>
      {label || showControl ? (
        <div className="hero-film-badges absolute left-(--gutter) top-[calc(var(--header-h)+0.75rem)] z-[5] flex max-w-[calc(100%-2*var(--gutter))] flex-wrap items-center gap-2">
          {label ? <span className="tag-impression static max-w-none">{label}</span> : null}
          {showControl ? (
            <button type="button" className="hero-film-toggle" onClick={() => setUserPaused((paused) => !paused)}>
              {userPaused ? en.common.playFilm : en.common.pauseFilm}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
