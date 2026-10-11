"use client";

/** React wrapper around the plain-three scene (scene-runtime.ts). Load it with a dynamic import: it is the only file that pulls in Three.js. */
import { useEffect, useRef } from "react";
import type { ProgressStore } from "./progress-store";
import { createDioramaScene, type SceneHandle } from "./scene-runtime";
import type { LabelAnchor, Station } from "./stations";
import { dioramaStrings } from "./strings";

interface SceneCanvasProps {
  store: ProgressStore;
  stations: readonly Station[];
  anchors: readonly LabelAnchor[];
  onBuildingSelect?: (buildingId: string) => void;
  onReady: () => void;
  onFail: () => void;
}

export default function SceneCanvas({ store, stations, anchors, onBuildingSelect, onReady, onFail }: SceneCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const labelEls = useRef(new Map<string, HTMLElement>());
  const latest = useRef({ onBuildingSelect, onReady, onFail });
  useEffect(() => {
    latest.current = { onBuildingSelect, onReady, onFail };
  });

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;
    let handle: SceneHandle;
    try {
      handle = createDioramaScene({
        container,
        stations,
        store,
        onReady: () => latest.current.onReady(),
        onFail: () => latest.current.onFail(),
        onSelect: (id) => latest.current.onBuildingSelect?.(id),
        onHover: (hovering) => {
          container.style.cursor = hovering ? "pointer" : "default";
        },
      });
    } catch {
      latest.current.onFail(); // WebGL context could not be created
      return;
    }
    handleRef.current = handle;
    return () => {
      handle.dispose();
      handleRef.current = null;
    };
  }, [stations, store]);

  useEffect(() => {
    handleRef.current?.setLabels(anchors, labelEls.current);
  }, [anchors]);

  return (
    <>
      <div ref={hostRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {anchors.map((a) => {
          const clickable = Boolean(a.buildingId && onBuildingSelect);
          return (
            <div
              key={a.id}
              ref={(el) => {
                if (el) labelEls.current.set(a.id, el);
                else labelEls.current.delete(a.id);
              }}
              className="absolute left-0 top-0 opacity-0 transition-opacity duration-300"
            >
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onBuildingSelect?.(a.buildingId as string)}
                  title={dioramaStrings.openInPlan}
                  className="t-mono-sm pointer-events-auto cursor-pointer whitespace-nowrap rounded-sm border border-ink bg-paper px-2 py-1 text-ink"
                >
                  {a.label}
                  {a.tbd ? " (TBD)" : ""}
                </button>
              ) : (
                <span className="t-mono-sm whitespace-nowrap rounded-sm border border-line-strong bg-paper/90 px-2 py-1 text-ink">
                  {a.label}
                  {a.tbd ? " (TBD)" : ""}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
