"use client";

import { useEffect, useRef } from "react";
import { FRAME_COUNT, frameIndexAt, frameUrl, nearestLoaded } from "./frames";
import type { ProgressStore } from "./progress-store";

const MAX_DPR = 2;
const CONCURRENT_LOADS = 3;

/** Draw `image` to fill the canvas, cropping the overflow (object-fit: cover). */
function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
}

/**
 * Tier B: the pre-rendered fly-through scrubbed by scroll. Frames load in order, three at a time, and the nearest
 * loaded frame is drawn until the exact one arrives. `onDraw` fires once, after the first frame is on the canvas. Stops loading, drawing and observing on unmount.
 */
export function SequenceCanvas({ store, onDraw }: { store: ProgressStore; onDraw?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDrawRef = useRef(onDraw);
  useEffect(() => {
    onDrawRef.current = onDraw;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const images = new Map<number, HTMLImageElement>();
    const loaded = new Set<number>();
    let wanted = frameIndexAt(store.get());
    let drawn = -1;
    let frameHandle = 0;
    let nextToLoad = 0;
    let active = 0;
    let disposed = false;
    let reported = false;

    const paint = () => {
      frameHandle = 0;
      const index = nearestLoaded(wanted, loaded);
      const image = images.get(index);
      if (!image || index === drawn) return;
      drawn = index;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCover(ctx, image, canvas.width, canvas.height);
      if (!reported) {
        reported = true;
        onDrawRef.current?.();
      }
    };
    const schedule = () => {
      if (!frameHandle && !disposed) frameHandle = requestAnimationFrame(paint);
    };
    const pump = () => {
      while (!disposed && active < CONCURRENT_LOADS && nextToLoad < FRAME_COUNT) {
        const index = nextToLoad;
        nextToLoad += 1;
        active += 1;
        const image = new Image();
        image.decoding = "async";
        const done = (ok: boolean) => {
          active -= 1;
          if (ok && !disposed) {
            images.set(index, image);
            loaded.add(index);
            if (nearestLoaded(wanted, loaded) === index) schedule();
          }
          pump();
        };
        image.onload = () => done(true);
        image.onerror = () => done(false);
        image.src = frameUrl(index + 1);
      }
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      drawn = -1;
      schedule();
    };

    const unsubscribe = store.subscribe((p) => {
      wanted = frameIndexAt(p);
      schedule();
    });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(canvas);
    resize();
    pump();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameHandle);
      unsubscribe();
      observer?.disconnect();
      images.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
      images.clear();
    };
  }, [store]);

  return <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden="true" />;
}
