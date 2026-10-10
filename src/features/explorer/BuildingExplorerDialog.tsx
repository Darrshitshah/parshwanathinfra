"use client";

/** The explorer as a modal dialog (opened from the Living Plan): focus trap, Escape and scrim close, focus returns. */
import { useRef } from "react";
import { createPortal } from "react-dom";
import { useDialog } from "@/components/ui/use-dialog";
import { BuildingExplorer } from "./BuildingExplorer";
import { explorerStrings } from "./strings";

export function BuildingExplorerDialog({ buildingId, onClose }: { buildingId: string; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog({ open: true, panelRef, onClose });
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="ex-dialog" data-explorer-dialog="">
      <div className="ex-dialog__scrim" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} className="ex-dialog__panel" role="dialog" aria-modal="true" aria-label="Building explorer" tabIndex={-1}>
        <button type="button" className="ex-dialog__close" onClick={onClose} aria-label={explorerStrings.close}>
          <span aria-hidden="true">×</span>
        </button>
        <BuildingExplorer buildingId={buildingId} headingLevel={2} />
      </div>
    </div>,
    document.body,
  );
}
