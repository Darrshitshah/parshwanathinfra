"use client";

/**
 * The diorama (S4). Picks the version for the device: Tier A with WebGL2 gets the Three.js scene, Tier B the pre-rendered
 * image sequence scrubbed by scroll, Tier C and reduced motion the overview still with the chapter captions.
 */
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { chapters } from "@/content/plan/chapters";
import { useDeviceTier } from "@/lib/device-tier-provider";
import { buildCaptions } from "./captions";
import { ScrollStage } from "./ScrollStage";
import { SequenceCanvas } from "./SequenceCanvas";
import { CaptionCard, ChapterTextList, StageBadges } from "./StageChrome";
import { StagePoster } from "./StagePoster";
import { StillFigure } from "./StillFigure";
import { buildStations, labelAnchors } from "./stations";
import { dioramaStrings } from "./strings";
import { pickDioramaMode } from "./tier-mode";

// Three.js stays in this lazily loaded chunk; the scene starts loading only after the tier is known and the slot is near.
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

export interface DioramaProps {
  onBuildingSelect?: (buildingId: string) => void;
  /** Shown while the device tier is still unknown. */
  fallback?: ReactNode;
}

export function Diorama({ onBuildingSelect, fallback }: DioramaProps) {
  const device = useDeviceTier();
  const [stageDrawn, setStageDrawn] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const onReady = useCallback(() => setStageDrawn(true), []); // first frame of the live scene or sequence is on screen
  const onFail = useCallback(() => setWebglFailed(true), []);

  const picked = pickDioramaMode(device);
  // A failed WebGL context or model download degrades to the sequence, never to a blank stage.
  const mode = picked === "webgl" && webglFailed ? "sequence" : picked;
  const stations = useMemo(() => buildStations(chapters), []);
  const captions = useMemo(() => buildCaptions(chapters), []);
  const anchorsByStation = useMemo(() => [[], ...chapters.map((chapter) => labelAnchors(chapter))], []);
  if (!device.ready) return <>{fallback ?? <StillFigure captions={captions} />}</>;
  if (mode === "still") return <StillFigure captions={captions} />;

  const tier = mode === "webgl" ? "A" : "B";
  return (
    <ScrollStage stationCount={stations.length} tier={tier} label={dioramaStrings.sequenceLabel}>
      {({ store, activeIndex }) => (
        <>
          {mode === "webgl" ? (
            <div className="absolute inset-0" role="img" aria-label={dioramaStrings.stageLabel}>
              <SceneCanvas
                store={store}
                stations={stations}
                anchors={anchorsByStation[activeIndex]}
                onBuildingSelect={onBuildingSelect}
                onReady={onReady}
                onFail={onFail}
              />
            </div>
          ) : (
            <div className="absolute inset-0" role="img" aria-label={dioramaStrings.stageLabel}>
              <SequenceCanvas store={store} onDraw={onReady} />
            </div>
          )}
          <StagePoster drawn={stageDrawn} />
          <StageBadges />
          <CaptionCard caption={captions[activeIndex]} index={activeIndex} total={captions.length} onBuildingSelect={onBuildingSelect} />
          <ChapterTextList captions={captions} />
        </>
      )}
    </ScrollStage>
  );
}
