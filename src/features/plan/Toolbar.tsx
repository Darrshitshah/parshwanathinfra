"use client";

/** The plan's tool buttons: zoom, whole plan, reality lens or photo, move on touch, list view, explore. */
import { cn } from "@/components/ui/cn";
import { planStrings } from "./strings";

export interface ToolbarProps {
  /** Pan and zoom tools show only when the camera is free (not while the scroll story drives it). */
  free: boolean;
  lensAvailable: boolean;
  lensOn: boolean;
  onLens: () => void;
  photoAvailable: boolean;
  photoOn: boolean;
  onPhoto: () => void;
  /** Touch: let the plan be moved and zoomed with fingers. */
  showMove: boolean;
  moveOn: boolean;
  onMove: () => void;
  onZoom: (factor: number) => void;
  onReset: () => void;
  twinShown: boolean;
  onTwin: () => void;
  /** "Explore the plan" (story) or "Back to the story" (after exploring); null hides it. */
  modeAction: { label: string; onClick: () => void } | null;
}

function Tool({ pressed, onClick, children, label, className }: { pressed?: boolean; onClick: () => void; children: React.ReactNode; label?: string; className?: string }) {
  return (
    <button type="button" className={cn("lp-tool", className)} aria-pressed={pressed} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

export function Toolbar(props: ToolbarProps) {
  const { free, lensAvailable, lensOn, onLens, photoAvailable, photoOn, onPhoto, showMove, moveOn, onMove, onZoom, onReset, twinShown, onTwin, modeAction } = props;
  const t = planStrings.tools;
  return (
    <div className="lp-tools" role="toolbar" aria-label="Plan tools" data-no-pan="">
      {lensAvailable ? (
        <Tool pressed={lensOn} onClick={onLens}>
          {t.lens}
        </Tool>
      ) : null}
      {photoAvailable ? (
        <Tool pressed={photoOn} onClick={onPhoto}>
          {t.photo}
        </Tool>
      ) : null}
      {free ? (
        <>
          <Tool label={t.zoomIn} onClick={() => onZoom(1.5)} className="lp-tool--icon">
            +
          </Tool>
          <Tool label={t.zoomOut} onClick={() => onZoom(1 / 1.5)} className="lp-tool--icon">
            <span aria-hidden="true">{"−"}</span>
          </Tool>
          <Tool onClick={onReset}>{t.reset}</Tool>
          {showMove ? (
            <Tool pressed={moveOn} onClick={onMove}>
              {moveOn ? t.moveDone : t.move}
            </Tool>
          ) : null}
        </>
      ) : null}
      <Tool pressed={twinShown} onClick={onTwin}>
        {twinShown ? t.drawing : t.list}
      </Tool>
      {modeAction ? (
        <Tool onClick={modeAction.onClick} className="lp-tool--accent">
          {modeAction.label}
        </Tool>
      ) : null}
    </div>
  );
}
