"use client";

/**
 * The photoreal render under the line drawing, as deep-zoom tiles inside the camera group (so it shares the
 * drawing's coordinates and stays pixel aligned through every pan and zoom).
 *  - <LensTiles>: tiles for a circular lens following the pointer or a dragged handle.
 *  - <PhotoTiles>: the tiles that cover the visible plan (Tier C "show photo", and the lens base).
 * Tile maths lives in tiles.ts; nothing here knows a coordinate.
 */
import { useEffect, useId, useRef, useState } from "react";
import { screenToGrid, visibleBox } from "./camera";
import { useCameraSelector, type CameraStore } from "./camera-store";
import { chooseTileLevel, levelAt, lensBox, tileHref, tileManifest, tileRect, tilesForBox, type TileRef } from "./tiles";

/** Neighbouring tiles overlap by a third of a level pixel so no seam shows between them at fractional zoom. */
const SEAM_PX = 0.35;
const MAX_KEPT = 72;

export interface TileQuality {
  dpr: number;
  maxZ: number;
}

function TileImage({ tile }: { tile: TileRef }) {
  const level = levelAt(tileManifest, tile.z);
  const seam = SEAM_PX / level.gridToPx;
  const [x, y, w, h] = tile.rect;
  return <image href={tile.href} x={x} y={y} width={w + seam} height={h + seam} preserveAspectRatio="none" />;
}

export interface LensHandle {
  /** Move the lens to a pixel position inside the stage. */
  moveTo: (x: number, y: number) => void;
  /** Show or hide it without losing its place. */
  show: (visible: boolean) => void;
  position: () => { x: number; y: number };
}

interface LensTilesProps {
  store: CameraStore;
  radiusPx: number;
  quality: TileQuality;
  /** Called once with the imperative handle. */
  handleRef: { current: LensHandle | null };
  /** Starting position in stage pixels (null = the middle of the stage). */
  start?: { x: number; y: number } | null;
}

/** The lens: a clipped group of tiles plus the roundabout-shaped ring. */
export function LensTiles({ store, radiusPx, quality, handleRef, start = null }: LensTilesProps) {
  const clipId = useId().replace(/:/g, "");
  const circleRef = useRef<SVGCircleElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const position = useRef(start ?? { x: store.getSize().w / 2, y: store.getSize().h / 2 });
  const visible = useRef(true);
  const kept = useRef<Map<string, TileRef>>(new Map());
  const [tiles, setTiles] = useState<TileRef[]>([]);
  const frame = useRef(0);

  useEffect(() => {
    const sync = () => {
      frame.current = 0;
      const cam = store.get();
      const size = store.getSize();
      const [gx, gy] = screenToGrid(cam, size, position.current.x, position.current.y);
      const r = radiusPx / cam.s;
      for (const el of [circleRef.current, ringRef.current]) {
        if (!el) continue;
        el.setAttribute("cx", String(gx));
        el.setAttribute("cy", String(gy));
        el.setAttribute("r", String(r));
      }
      groupRef.current?.setAttribute("data-visible", visible.current ? "true" : "false");
      ringRef.current?.setAttribute("data-visible", visible.current ? "true" : "false");
      if (!visible.current) return;

      const box = lensBox(gx, gy, r);
      const level = chooseTileLevel(tileManifest, cam.s, quality);
      const wanted = [...tilesForBox(tileManifest, levelAt(tileManifest, 0), box), ...(level.z > 0 ? tilesForBox(tileManifest, level, box) : [])];
      const map = kept.current;
      let added = false;
      for (const tile of wanted) {
        if (!map.has(tile.key)) {
          map.set(tile.key, tile);
          added = true;
        }
      }
      if (map.size > MAX_KEPT) {
        // drop the oldest entries but keep the base level, which is tiny
        for (const key of Array.from(map.keys())) {
          if (map.size <= MAX_KEPT) break;
          if (!key.startsWith("0/")) map.delete(key);
        }
        added = true;
      }
      if (added) setTiles(Array.from(map.values()).sort((a, b) => a.z - b.z));
    };
    const schedule = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(sync);
    };

    handleRef.current = {
      moveTo: (x, y) => {
        position.current = { x, y };
        schedule();
      },
      show: (next) => {
        visible.current = next;
        schedule();
      },
      position: () => position.current,
    };
    const unsubscribe = store.subscribe(schedule);
    sync();
    return () => {
      unsubscribe();
      if (frame.current) cancelAnimationFrame(frame.current);
      handleRef.current = null;
    };
  }, [store, radiusPx, quality, handleRef]);

  return (
    <>
      <clipPath id={`lp-lens-${clipId}`}>
        <circle ref={circleRef} r={radiusPx} />
      </clipPath>
      <g ref={groupRef} className="lp-lens-photo" clipPath={`url(#lp-lens-${clipId})`} data-visible="true">
        {tiles.map((tile) => (
          <TileImage key={tile.key} tile={tile} />
        ))}
      </g>
      <circle ref={ringRef} className="lp-lens-ring" r={radiusPx} vectorEffect="non-scaling-stroke" data-visible="true" />
    </>
  );
}

/** The tile index ranges that cover the visible plan at the level the zoom needs, as a primitive key. */
function coverKey(store: CameraStore, quality: TileQuality): string {
  const cam = store.get();
  const level = chooseTileLevel(tileManifest, cam.s, quality);
  const [x, y, w, h] = visibleBox(cam, store.getSize());
  const tiles = tilesForBox(tileManifest, level, [x, y, w, h]);
  if (tiles.length === 0) return `${level.z}:`;
  return `${level.z}:${tiles.map((tile) => `${tile.x}_${tile.y}`).join(",")}`;
}

/** The photo: every tile that covers the visible plan. Re-evaluated when the set of tiles changes, not per frame. */
export function PhotoTiles({ store, quality }: { store: CameraStore; quality: TileQuality }) {
  const key = useCameraSelector(store, () => coverKey(store, quality));
  const [z, list] = key.split(":");
  const level = levelAt(tileManifest, Number(z));
  const tiles: TileRef[] = list
    ? list.split(",").map((pair) => {
        const [x, y] = pair.split("_").map(Number);
        return { z: level.z, x, y, key: `${level.z}/${x}_${y}`, href: tileHref(tileManifest, level.z, x, y), rect: tileRect(tileManifest, level, x, y) };
      })
    : [];
  return (
    <g className="lp-photo" aria-hidden="true">
      {tiles.map((tile) => (
        <TileImage key={tile.key} tile={tile} />
      ))}
    </g>
  );
}
