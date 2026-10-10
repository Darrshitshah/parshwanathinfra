"use client";

/**
 * Gallery lightbox: one frame at a time on a sheet of paper. A real dialog (role="dialog", aria-modal, focus trap,
 * Escape to close, focus restored to the frame that opened it) with Left and Right arrow keys, Home and End,
 * previous and next buttons, and swipe on touch. Loaded lazily from GalleryStrip. Owner: pages-lead.
 */
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, useIsPresent } from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { useDialog } from "@/components/ui/use-dialog";
import type { GalleryItem, GalleryLabels } from "./gallery-types";

const SWIPE_DISTANCE_PX = 50;

interface GalleryLightboxProps {
  items: readonly GalleryItem[];
  open: boolean;
  index: number;
  labels: GalleryLabels;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

type ViewerProps = Omit<GalleryLightboxProps, "open">;

function Viewer({ items, index, labels, onClose, onIndexChange }: ViewerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipeStart = useRef<number | null>(null);
  const present = useIsPresent();
  useDialog({ open: present, panelRef, onClose, initialFocusRef: closeRef });

  const count = items.length;
  const item = items[index];
  const step = (delta: number) => onIndexChange((index + delta + count) % count);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") onIndexChange((index + 1) % count);
      else if (event.key === "ArrowLeft") onIndexChange((index - 1 + count) % count);
      else if (event.key === "Home") onIndexChange(0);
      else if (event.key === "End") onIndexChange(count - 1);
      else return;
      event.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [index, count, onIndexChange]);

  if (!item) return null;

  return (
    <m.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={labels.dialog}
      tabIndex={-1}
      data-lenis-prevent=""
      data-gallery-lightbox=""
      className="fixed inset-0 z-(--z-drawer) flex flex-col bg-paper-sunk outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex h-(--header-h) shrink-0 items-center justify-between gap-4 px-(--gutter)">
        <p className="t-mono m-0 text-ink" aria-live="polite">
          {String(index + 1).padStart(2, "0")} {labels.counterOf} {String(count).padStart(2, "0")}
        </p>
        <button ref={closeRef} type="button" className="btn-icon btn-icon--outlined" onClick={onClose} aria-label={labels.close}>
          <Icon name="close" />
        </button>
      </div>

      <div
        className="relative min-h-0 flex-1 touch-pan-y"
        onPointerDown={(event) => {
          swipeStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (swipeStart.current === null) return;
          const distance = event.clientX - swipeStart.current;
          swipeStart.current = null;
          if (Math.abs(distance) >= SWIPE_DISTANCE_PX) step(distance < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
      >
        <Image
          key={item.id}
          src={item.src}
          alt={item.alt}
          fill
          sizes="100vw"
          quality={85}
          placeholder="blur"
          blurDataURL={item.blurDataURL}
          className="object-contain px-[max(1rem,6vw)] py-2"
        />
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label={labels.previous}
          className="btn-icon btn-icon--outlined absolute left-2 top-1/2 -translate-y-1/2 bg-paper md:left-6"
        >
          <Icon name="chevron-left" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label={labels.next}
          className="btn-icon btn-icon--outlined absolute right-2 top-1/2 -translate-y-1/2 bg-paper md:right-6"
        >
          <Icon name="chevron-right" />
        </button>
      </div>

      <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-(--gutter) py-5">
        <p className="t-display-4 m-0 text-ink">{item.caption ?? ""}</p>
        {item.artistImpression ? <span className="chip">{labels.artistsImpression}</span> : null}
      </div>
    </m.div>
  );
}

export function GalleryLightbox({ open, ...rest }: GalleryLightboxProps) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <AnimatePresence>{open ? <Viewer key="viewer" {...rest} /> : null}</AnimatePresence>
      </MotionConfig>
    </LazyMotion>,
    document.body,
  );
}
