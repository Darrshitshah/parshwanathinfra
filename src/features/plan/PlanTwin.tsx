"use client";

/**
 * The accessible twin of the plan: zones, buildings, plots and amenities as tables, built from the same content as
 * the drawing. It is always in the document. Hidden visually until the reader asks for it ("View as list" or the
 * skip link), it stays readable by screen readers and its buttons are only tabbable once it is shown.
 */
import { forwardRef } from "react";
import { Tbd } from "@/components/ui/Tbd";
import { cn } from "@/components/ui/cn";
import { amenityRows, buildingRows, plotRows, zoneRows } from "./twin-data";
import { planStrings } from "./strings";

interface PlanTwinProps {
  shown: boolean;
  onOpenBuilding: (id: string) => void;
  onOpenPlot: (number: number) => void;
}

function Cell({ value }: { value: string }) {
  return value === "TBD" ? <Tbd /> : <>{value}</>;
}

export const PlanTwin = forwardRef<HTMLDivElement, PlanTwinProps>(function PlanTwin({ shown, onOpenBuilding, onOpenPlot }, ref) {
  const tab = shown ? 0 : -1;
  const t = planStrings.twin;
  return (
    <div ref={ref} id="lp-twin" tabIndex={-1} className={cn("lp-twin", !shown && "sr-only")} aria-labelledby="lp-twin-title">
      <h3 id="lp-twin-title" className="lp-twin__title">
        {t.heading}
      </h3>
      <p className="lp-twin__lead">{t.lead}</p>

      <table className="lp-table">
        <caption>{t.zones}</caption>
        <thead>
          <tr>
            <th scope="col">Zone</th>
            <th scope="col">Buildings</th>
            <th scope="col">Types</th>
            <th scope="col">Plots</th>
          </tr>
        </thead>
        <tbody>
          {zoneRows().map((zone) => (
            <tr key={zone.id}>
              <th scope="row">{zone.name}</th>
              <td>{zone.buildings}</td>
              <td>{zone.typologies.join(", ")}</td>
              <td>{zone.plots > 0 ? zone.plots : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="lp-table-wrap" tabIndex={tab} role="region" aria-label={t.buildings}>
        <table className="lp-table">
          <caption>{t.buildings}</caption>
          <thead>
            <tr>
              <th scope="col">Building</th>
              <th scope="col">Type</th>
              <th scope="col">Sector</th>
              <th scope="col">{t.floors}</th>
              <th scope="col">
                <span className="sr-only">Explorer</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {buildingRows().map((row) => (
              <tr key={row.id}>
                <th scope="row">
                  {row.title}
                  {row.indicative ? <span className="lp-muted"> · indicative</span> : null}
                </th>
                <td>{row.typologyLabel}</td>
                <td>
                  <Cell value={row.sector} />
                </td>
                <td>
                  <Cell value={row.floors} />
                  {row.floorsIndicative ? <span className="lp-muted"> ({t.indicative})</span> : null}
                </td>
                <td>
                  {row.explorable ? (
                    <button type="button" className="lp-link" tabIndex={tab} onClick={() => onOpenBuilding(row.id)}>
                      {t.open} <span className="sr-only">{row.title}</span>
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lp-table-wrap" tabIndex={tab} role="region" aria-label={t.plots}>
        <table className="lp-table">
          <caption>{t.plots}</caption>
          <thead>
            <tr>
              <th scope="col">Plot</th>
              <th scope="col">Type</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {plotRows().map((row) => (
              <tr key={row.number}>
                <th scope="row">{row.number}</th>
                <td>
                  <Cell value={row.type === "TBD" ? "TBD" : row.type.replace("BHK", " BHK")} />
                  {row.lowConfidence ? <span className="lp-muted"> · {planStrings.plotCard.indicative.toLowerCase()}</span> : null}
                </td>
                <td>
                  <Cell value={row.status} />
                </td>
                <td>
                  <button type="button" className="lp-link" tabIndex={tab} onClick={() => onOpenPlot(row.number)}>
                    {t.open} <span className="sr-only">plot {row.number}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <table className="lp-table">
        <caption>{t.amenities}</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Kind</th>
            <th scope="col">Shown on</th>
          </tr>
        </thead>
        <tbody>
          {amenityRows().map((row) => (
            <tr key={row.id}>
              <th scope="row">
                {row.name}
                {row.labelTbd ? (
                  <>
                    {" "}
                    <Tbd />
                  </>
                ) : null}
              </th>
              <td>{row.kind}</td>
              <td>{row.evidence.replace(/-/g, " ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
