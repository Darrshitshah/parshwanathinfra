/**
 * The line drawing of the township, rendered from plan.json. Static: it never re-renders on hover, zoom or scroll
 * (the typology highlight is pure CSS keyed on `data-active`, the camera is a transform on the parent group).
 * Class names follow the web plan SVG (`public/plan/shiv-shiva-plan.svg`); ids use the same scheme (`b-`, `plot-`,
 * `road-`, `g-`, `a-`, `e-`) so a hotspot, a pin and a node share one name. Geometry comes only from content.
 */
import { memo } from "react";
import { plan } from "@/content/plan";
import type { Typology } from "@/content/schema";
import { pathD } from "./plan-paths";
import { alsoFor } from "./filter-state";

const NS = "non-scaling-stroke" as const;
const BUILDING_ORDER: readonly Typology[] = ["flats", "mixed", "shops", "office", "rowhouses"];

function Context() {
  return (
    <>
      {plan.districts.map((district) => (
        <path key={district.id} id={`district-${district.id}`} className="lp-district" d={pathD(district.polygon)} vectorEffect={NS} />
      ))}
      <g className="lp-gardens">
        {plan.gardens.map((garden) => (
          <path key={garden.id} id={`g-${garden.id}`} className="lp-garden" d={pathD(garden.polygon)} />
        ))}
      </g>
    </>
  );
}

/** Roads and the site boundary: the one-time ink draw-in targets these strokes. */
function Ink() {
  return (
    <g className="lp-ink" data-ink="">
      {plan.roads.map((road) =>
        road.polygon ? (
          <path key={road.id} id={`road-${road.id}`} className={road.public ? "lp-road is-public" : "lp-road"} d={pathD(road.polygon)} vectorEffect={NS} />
        ) : (
          <path key={road.id} id={`road-${road.id}`} className="lp-lane" d={pathD(road.centerline, false)} vectorEffect={NS} />
        ),
      )}
      <path id="boundary" className="lp-boundary" d={pathD(plan.boundary)} vectorEffect={NS} />
    </g>
  );
}

function Buildings() {
  return (
    <>
      {BUILDING_ORDER.map((typology) => {
        const items = plan.buildings.filter((building) => building.typology === typology);
        if (items.length === 0) return null;
        return (
          <g key={typology} id={`typology-${typology}`}>
            {items.map((building) => {
              const also = alsoFor(typology);
              return (
                <path
                  key={building.id}
                  id={`b-${building.id}`}
                  className={`lp-building lp-t t-${typology}${building.indicative ? " is-indicative" : ""}`}
                  data-t={typology}
                  data-also={also.length > 0 ? also.join(" ") : undefined}
                  data-building={building.id}
                  d={pathD(building.polygon)}
                  vectorEffect={NS}
                />
              );
            })}
          </g>
        );
      })}
    </>
  );
}

function Plots() {
  return (
    <g className="lp-plots">
      {plan.plots.map((plot) => (
        <path
          key={plot.number}
          id={`plot-${plot.number}`}
          className={`lp-plot lp-t${plot.numberConfidence === "low" ? " is-low" : ""}`}
          data-t="rowhouses"
          data-plot={plot.number}
          d={pathD(plot.polygon)}
          vectorEffect={NS}
        />
      ))}
    </g>
  );
}

function Furniture() {
  const { center, radius } = plan.roundabout;
  return (
    <>
      <g className="lp-amenities">
        {plan.amenities.map((amenity) =>
          amenity.polygon ? (
            <path key={amenity.id} id={`a-${amenity.id}`} className={`lp-amenity k-${amenity.kind}${amenity.labelTbd ? " is-tbd" : ""}`} d={pathD(amenity.polygon)} vectorEffect={NS} />
          ) : (
            <circle key={amenity.id} id={`a-${amenity.id}`} className={`lp-amenity k-${amenity.kind}${amenity.labelTbd ? " is-tbd" : ""}`} cx={amenity.point[0]} cy={amenity.point[1]} r={7} vectorEffect={NS} />
          ),
        )}
      </g>
      <g className="lp-entries">
        {plan.entries.map((entry) => (
          <circle key={entry.id} id={`e-${entry.id}`} className={`lp-entry k-${entry.kind}`} cx={entry.point[0]} cy={entry.point[1]} r={entry.kind === "main" ? 9 : 6} />
        ))}
      </g>
      <g className="lp-roundabout">
        <circle className="lp-ring" cx={center[0]} cy={center[1]} r={radius} vectorEffect={NS} />
        <circle className="lp-ring is-island" cx={center[0]} cy={center[1]} r={Math.round(radius * 0.63)} vectorEffect={NS} />
      </g>
    </>
  );
}

function PlanDrawingBase() {
  return (
    <g className="lp-drawing">
      <Context />
      <Ink />
      <Buildings />
      <Plots />
      <Furniture />
    </g>
  );
}

export const PlanDrawing = memo(PlanDrawingBase);

function PlotLabelsBase({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <g className="lp-plot-labels" aria-hidden="true">
      {plan.plots.map((plot) => {
        const xs = plot.polygon.map((p) => p[0]);
        const ys = plot.polygon.map((p) => p[1]);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        return (
          <text key={plot.number} x={cx} y={cy} className={plot.numberConfidence === "low" ? "is-low" : undefined}>
            {plot.number}
          </text>
        );
      })}
    </g>
  );
}

/** Plot numbers 1 to 165, drawn only at row-house zoom. */
export const PlotLabels = memo(PlotLabelsBase);
