"use client";

/**
 * A tiny external store for the camera, so a scroll-driven or pointer-driven move updates the stage's transform,
 * the hotspot positions and the lens directly (no React render per frame) while React only re-renders when a
 * coarse derived value (zoom band, visible plots) changes.
 */
import { useSyncExternalStore } from "react";
import { FALLBACK_SIZE, type Cam, type Size } from "./camera";

export class CameraStore {
  private cam: Cam;
  private size: Size = FALLBACK_SIZE;
  private version = 0;
  private readonly listeners = new Set<() => void>();

  constructor(initial: Cam) {
    this.cam = initial;
  }

  get(): Cam {
    return this.cam;
  }

  getSize(): Size {
    return this.size;
  }

  getVersion(): number {
    return this.version;
  }

  set(cam: Cam): void {
    if (cam.cx === this.cam.cx && cam.cy === this.cam.cy && cam.s === this.cam.s) return;
    this.cam = cam;
    this.emit();
  }

  setSize(size: Size): void {
    if (size.w === this.size.w && size.h === this.size.h) return;
    this.size = size;
    this.emit();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit(): void {
    this.version += 1;
    this.listeners.forEach((listener) => listener());
  }
}

/**
 * Read a coarse value derived from the camera. `select` must return a primitive (number, string, boolean) so that
 * React skips the render while the value is unchanged.
 */
export function useCameraSelector<T extends string | number | boolean>(
  store: CameraStore,
  select: (cam: Cam, size: Size) => T,
): T {
  const read = () => select(store.get(), store.getSize());
  return useSyncExternalStore(store.subscribe, read, read);
}
