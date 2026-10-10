/**
 * Figure: next/image with the media library's blur placeholder, a fixed aspect ratio (no layout shift), the
 * "Artist's impression" corner label for renders, optional registration marks and mono callouts, and an optional
 * mono caption. Width and height always come from the media record, never from the caller.
 */
import Image from "next/image";
import type { ReactNode } from "react";
import type { CalloutSpec } from "@/content/copy/callouts";
import { en } from "@/content/i18n/en";
import type { Media } from "@/content/schema";
import { cn } from "@/components/ui/cn";
import { Callouts } from "./Callouts";

type Quality = 60 | 75 | 85;

export interface FigureProps {
  media: Media;
  /** The `sizes` attribute: how wide the image renders at each breakpoint. Required so the browser picks a sensible file. */
  sizes: string;
  /**
   * CSS aspect-ratio override such as "21 / 9" (the image is cropped with object-fit). Defaults to the media's own
   * ratio. `null` sets none: the caller sizes the frame with classes (for example a responsive aspect-[..] class).
   */
  aspect?: string | null;
  fit?: "cover" | "contain";
  objectPosition?: string;
  /** The LCP image: preloaded, eager, high priority. */
  preload?: boolean;
  quality?: Quality;
  /** `true` shows the media's own caption; a node shows that instead. */
  caption?: ReactNode | true;
  /** Corner label. Defaults to the media's artistImpression flag. */
  showLabel?: boolean;
  /** Registration marks around the frame. */
  marks?: boolean;
  callouts?: readonly CalloutSpec[];
  /** Show the callouts only from the lg breakpoint (for a lone pin with no legend). */
  calloutsDesktopOnly?: boolean;
  /** The figure fills its parent's height (the parent sets the size). Use with `aspect={null}`. */
  fillParent?: boolean;
  /** Pure decoration: empty alt text. */
  decorative?: boolean;
  className?: string;
  frameClassName?: string;
  imageClassName?: string;
  captionClassName?: string;
  /** data-* attributes placed on the <img> itself (for example data-hero-image). */
  imageData?: Record<`data-${string}`, string>;
  /** Extra overlay content inside the frame. */
  children?: ReactNode;
}

export function Figure({
  media,
  sizes,
  aspect,
  fit = "cover",
  objectPosition,
  preload = false,
  quality = 75,
  caption,
  showLabel,
  marks = false,
  callouts,
  calloutsDesktopOnly = false,
  fillParent = false,
  decorative = false,
  className,
  frameClassName,
  imageClassName,
  captionClassName,
  imageData,
  children,
}: FigureProps) {
  const label = showLabel ?? media.artistImpression;
  const captionContent = caption === true ? media.caption : caption;
  return (
    <figure className={cn("m-0", fillParent && "flex h-full flex-col", className)}>
      <div className={cn(marks && "marks", fillParent && "min-h-0 flex-1")}>
        <div
          className={cn("relative overflow-hidden bg-paper-sunk", fillParent && "h-full", frameClassName)}
          style={aspect === null ? undefined : { aspectRatio: aspect ?? `${media.width} / ${media.height}` }}
        >
          <Image
            src={media.src}
            alt={decorative ? "" : media.alt}
            fill
            sizes={sizes}
            quality={quality}
            placeholder="blur"
            blurDataURL={media.blurDataURL}
            preload={preload}
            loading={preload ? "eager" : undefined}
            fetchPriority={preload ? "high" : undefined}
            className={cn(fit === "cover" ? "object-cover" : "object-contain", imageClassName)}
            style={objectPosition ? { objectPosition } : undefined}
            {...imageData}
          />
          {label ? <span className="tag-impression">{en.common.artistsImpression}</span> : null}
          {callouts && callouts.length > 0 ? <Callouts items={callouts} desktopOnly={calloutsDesktopOnly} /> : null}
          {children}
        </div>
      </div>
      {captionContent ? (
        <figcaption className={cn("t-mono-sm mt-3 text-ink-muted", captionClassName)}>{captionContent}</figcaption>
      ) : null}
    </figure>
  );
}
