"use client";

/**
 * Gallery reel: a horizontal strip of frames (fixed height, width from each image's own ratio, so nothing shifts)
 * with mono frame numbers and the "Artist's impression" label on every frame. Each frame opens a lightbox that is
 * loaded only on the first click. The strip scrolls with touch, trackpad, shift-wheel and keyboard (it is a focusable
 * scroll region). Hooks for motion: [data-gallery-strip] and [data-gallery-item]. Owner: pages-lead.
 */
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, type MouseEvent } from "react";
import type { GalleryItem, GalleryLabels } from "./gallery-types";

const GalleryLightbox = dynamic(() => import("./GalleryLightbox").then((module) => module.GalleryLightbox), { ssr: false });

interface GalleryStripProps {
  items: readonly GalleryItem[];
  labels: GalleryLabels;
}

export function GalleryStrip({ items, labels }: GalleryStripProps) {
  const [viewer, setViewer] = useState<{ open: boolean; loaded: boolean; index: number }>({ open: false, loaded: false, index: 0 });
  const total = String(items.length).padStart(2, "0");

  function openAt(event: MouseEvent<HTMLButtonElement>, index: number) {
    // Safari does not focus a button on click: focus it so the viewer can hand focus back when it closes.
    event.currentTarget.focus();
    setViewer({ open: true, loaded: true, index });
  }

  return (
    <>
      <ul
        data-gallery-strip=""
        data-cursor-label="Drag"
        aria-label={labels.strip}
        tabIndex={0}
        className="scroller m-0 mt-12 flex list-none snap-x snap-proximity gap-3 p-0 px-[max(var(--gutter),calc((100vw-var(--content-max))/2+var(--gutter)))] scroll-px-[max(var(--gutter),calc((100vw-var(--content-max))/2+var(--gutter)))] pb-6 md:gap-4"
      >
        {items.map((item, index) => (
          <li
            key={item.id}
            data-gallery-item={item.id}
            data-blinds-item=""
            className="relative h-[clamp(14rem,34vw,31rem)] shrink-0 snap-start"
            style={{ aspectRatio: `${item.width} / ${item.height}` }}
          >
            <button
              type="button"
              onClick={(event) => openAt(event, index)}
              aria-label={`${labels.open}: ${item.caption ?? item.alt}`}
              aria-haspopup="dialog"
              data-cursor-label="View"
              className="group relative block size-full cursor-zoom-in overflow-hidden bg-paper-sunk"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(min-width: 768px) 50vw, 85vw"
                quality={75}
                placeholder="blur"
                blurDataURL={item.blurDataURL}
                className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
              />
              <span className="t-mono-sm absolute left-2 top-2 z-[3] bg-paper px-2 py-1 text-ink">
                {String(index + 1).padStart(2, "0")} / {total}
              </span>
              {item.artistImpression ? <span className="tag-impression">{labels.artistsImpression}</span> : null}
            </button>
          </li>
        ))}
      </ul>

      {viewer.loaded ? (
        <GalleryLightbox
          items={items}
          open={viewer.open}
          index={viewer.index}
          labels={labels}
          onClose={() => setViewer((previous) => ({ ...previous, open: false }))}
          onIndexChange={(index) => setViewer((previous) => ({ ...previous, index }))}
        />
      ) : null}
    </>
  );
}
