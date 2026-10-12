"use client";

/**
 * <BuildingExplorer buildingId>: S5. Floor picker, then unit plan.
 *  - a schematic elevation with one SVG band per floor; hover or focus lights a floor in availability colours;
 *  - a click lists the floor's homes (TBD today: the plans we can show are offered as samples);
 *  - choosing a plan draws its CAD floor plan room by room, with room names and sizes in mono;
 *  - "Enquire about this home" opens the enquiry drawer with the block, floor and plan filled in.
 * Floors are confirmed (Ground, 1st to 5th floor, roof terrace above); units per floor are still TBD.
 */
import "./explorer.css";
import { useMemo, useState } from "react";
import { EnquireButton } from "@/components/ui/EnquireButton";
import { Tbd } from "@/components/ui/Tbd";
import { cn } from "@/components/ui/cn";
import { shivShiva } from "@/content/projects";
import type { UnitType } from "@/content/schema";
import { Elevation } from "./Elevation";
import { explorerModel, unitEnquiryLabel, type FloorBand, type InventoryUnit } from "./floors";
import { explorerStrings } from "./strings";
import { UnitPlan } from "./UnitPlan";
import { getUnitType } from "@/content/units";

export interface BuildingExplorerProps {
  buildingId: string;
  /** Heading level of the block title (the dialog uses 2, an inline panel 3). */
  headingLevel?: 2 | 3;
  className?: string;
}

interface Chosen {
  unit: UnitType;
  /** The inventory unit, when units are known; null for a sample plan. */
  home: InventoryUnit | null;
}

const STATUS_VAR: Record<string, string> = {
  available: "var(--status-available)",
  booked: "var(--status-booked)",
  sold: "var(--status-sold)",
  TBD: "var(--status-tbd)",
};

function Legend({ statuses }: { statuses: readonly string[] }) {
  const real = statuses.filter((status) => status !== "TBD");
  return (
    <div className="ex-legend" role="group" aria-label={explorerStrings.legendHeading}>
      {real.length === 0 ? (
        <span className="ex-legend__item">
          <i className="ex-legend__swatch is-tbd" aria-hidden="true" />
          {explorerStrings.legendTbd}
        </span>
      ) : (
        statuses.map((status) => (
          <span key={status} className="ex-legend__item">
            <i className="ex-legend__swatch" style={{ background: STATUS_VAR[status] }} aria-hidden="true" />
            {explorerStrings.statusNames[status as keyof typeof explorerStrings.statusNames]}
          </span>
        ))
      )}
    </div>
  );
}

function FloorCard({ band, units, onPick, chosen }: { band: FloorBand; units: readonly UnitType[]; onPick: (unit: UnitType, home: InventoryUnit | null) => void; chosen: Chosen | null }) {
  return (
    <div className="ex-floor" aria-live="polite">
      <h4 className="ex-floor__title">{band.label}</h4>
      {band.units ? (
        band.units.length > 0 ? (
          <ul className="ex-units">
            {band.units.map((home) => {
              const unit = getUnitType(home.unitTypeId);
              return (
                <li key={home.id}>
                  <button
                    type="button"
                    className="ex-unit"
                    aria-pressed={chosen?.home?.id === home.id}
                    disabled={!unit}
                    onClick={() => unit && onPick(unit, home)}
                  >
                    <span>{explorerStrings.unit(home.id)}</span>
                    <span className="ex-unit__meta">{unit ? unit.label : "Plan: TBD"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="ex-muted">{explorerStrings.unitsLabel}</p>
        )
      ) : (
        <>
          <p className="ex-muted">
            {explorerStrings.unitsLabel} <Tbd />
          </p>
          <h5 className="ex-floor__sub">{explorerStrings.samplesHeading}</h5>
          <p className="ex-muted">{explorerStrings.samplesNote}</p>
          <ul className="ex-units">
            {units.map((unit) => (
              <li key={unit.id}>
                <button type="button" className="ex-unit" aria-pressed={chosen?.unit.id === unit.id} onClick={() => onPick(unit, null)}>
                  <span>{unit.label}</span>
                  <span className="ex-unit__meta">{explorerStrings.drawPlan}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function BuildingExplorer({ buildingId, headingLevel = 3, className }: BuildingExplorerProps) {
  const model = useMemo(() => explorerModel(buildingId), [buildingId]);
  const [selected, setSelected] = useState<number | null>(null);
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [replay, setReplay] = useState(0);

  if (!model) return null;
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const band = selected !== null ? model.bands[selected] : undefined;
  const enquiryLabel = unitEnquiryLabel(model.title, band?.label ?? null, chosen ? (chosen.home ? explorerStrings.unit(chosen.home.id) : chosen.unit.label) : null);

  const pick = (unit: UnitType, home: InventoryUnit | null) => {
    setChosen({ unit, home });
    setReplay((value) => value + 1);
  };

  return (
    <div className={cn("ex", className)} data-building={buildingId}>
      <header className="ex-head">
        <Heading className="ex-title">{explorerStrings.title(model.title)}</Heading>
        <p className="ex-floors">
          {model.floorCount === null || model.floorsIndicative ? (
            <>
              <span>Floors:</span> <Tbd />
              {model.floorCount !== null ? <span className="ex-muted"> {explorerStrings.floorsIndicative(model.floorCount)}</span> : null}
            </>
          ) : (
            <>
              <span>{explorerStrings.floorsConfirmed(model.floorCount - 1)}</span>
              {model.terrace ? <span className="ex-muted">{` · ${explorerStrings.terraceNote}`}</span> : null}
            </>
          )}
        </p>
      </header>

      {model.bands.length > 0 ? (
        <div className="ex-grid">
          <div className="ex-figure">
            <Elevation model={model} selected={selected} onSelect={(index) => setSelected((current) => (current === index ? null : index))} />
            <Legend statuses={model.statuses} />
            {model.floorsIndicative ? <p className="ex-muted">{explorerStrings.indicativeNote}</p> : null}
          </div>
          <div className="ex-side">
            {band ? <FloorCard band={band} units={model.samples} onPick={pick} chosen={chosen} /> : <p className="ex-muted">{explorerStrings.pickFloor}</p>}
          </div>
        </div>
      ) : (
        <p className="ex-muted">{explorerStrings.floorsTbd}</p>
      )}

      <section className="ex-planbox" aria-label={explorerStrings.planHeading}>
        {chosen ? (
          <>
            <UnitPlan unit={chosen.unit} replay={replay} />
            <div className="ex-actions">
              <button type="button" className="lp-link" onClick={() => setReplay((value) => value + 1)}>
                {explorerStrings.replay}
              </button>
              <EnquireButton prefill={{ project: shivShiva.slug, unit: enquiryLabel }}>{explorerStrings.enquire}</EnquireButton>
            </div>
          </>
        ) : band ? (
          <p className="ex-muted">{explorerStrings.pickPlan}</p>
        ) : null}
      </section>
    </div>
  );
}
