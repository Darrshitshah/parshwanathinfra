"use client";

/**
 * A clean schematic elevation of a block: one SVG band per floor. Hover or focus lights a band in its availability
 * colour; a click (or Enter, Space) selects the floor; Up and Down move between bands. The silhouette is drawn from
 * data (floor count, the block's relative length); it is not a measured drawing and says so.
 */
import { useId, type KeyboardEvent } from "react";
import { massingWidth, type ExplorerModel } from "./floors";
import { explorerStrings } from "./strings";

const BAND_H = 34;
const PLINTH_H = 8;
const PARAPET_H = 10;
const SIDE = 14;
const WINDOW_GAP = 30;

interface ElevationProps {
  model: ExplorerModel;
  selected: number | null;
  onSelect: (index: number) => void;
}

export function Elevation({ model, selected, onSelect }: ElevationProps) {
  const patternId = useId().replace(/:/g, "");
  const count = model.bands.length;
  const width = massingWidth(model.building);
  const height = PARAPET_H + count * BAND_H + PLINTH_H;
  const columns = Math.max(3, Math.round(width / WINDOW_GAP));
  const pitch = (width - SIDE * 2) / columns;

  const move = (event: KeyboardEvent<SVGGElement>, index: number) => {
    const step = event.key === "ArrowUp" ? 1 : event.key === "ArrowDown" ? -1 : 0;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(index);
    } else if (step !== 0) {
      event.preventDefault();
      const next = Math.min(Math.max(index + step, 0), count - 1);
      const target = (event.currentTarget.parentElement as Element | null)?.querySelector<SVGGElement>(`[data-band="${next}"]`);
      target?.focus();
    }
  };

  return (
    <svg className="ex-elevation" viewBox={`-26 0 ${width + 52} ${height}`} role="group" aria-label={explorerStrings.elevationLabel} preserveAspectRatio="xMidYMax meet">
      <defs>
        <pattern id={`ex-hatch-${patternId}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" className="ex-hatch" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={width} height={PARAPET_H} className="ex-parapet" />
      <rect x={0} y={height - PLINTH_H} width={width} height={PLINTH_H} className="ex-plinth" />
      {model.bands
        .slice()
        .reverse()
        .map((band) => {
          const y = PARAPET_H + (count - 1 - band.index) * BAND_H;
          const isSelected = selected === band.index;
          return (
            <g
              key={band.index}
              className={`ex-band is-${band.status === "TBD" ? "tbd" : band.status}${isSelected ? " is-selected" : ""}`}
              data-band={band.index}
              role="button"
              tabIndex={band.index === (selected ?? 0) ? 0 : -1}
              aria-pressed={isSelected}
              aria-label={`${band.label}, ${band.indicative ? "indicative, " : ""}${explorerStrings.statusNames[band.status === "TBD" ? "TBD" : band.status].toLowerCase()}`}
              onClick={() => onSelect(band.index)}
              onKeyDown={(event) => move(event, band.index)}
            >
              <rect x={0} y={y} width={width} height={BAND_H} className="ex-band__bg" />
              <rect x={0} y={y} width={width} height={BAND_H} className="ex-band__fill" fill={band.status === "TBD" ? `url(#ex-hatch-${patternId})` : undefined} />
              {Array.from({ length: columns }, (_, column) => (
                <rect key={column} x={SIDE + column * pitch + pitch * 0.2} y={y + BAND_H * 0.25} width={pitch * 0.6} height={BAND_H * 0.5} className="ex-win" />
              ))}
              <line x1={0} y1={y + BAND_H} x2={width} y2={y + BAND_H} className="ex-slab" />
              <text x={-8} y={y + BAND_H / 2} className="ex-band__label" textAnchor="end" dominantBaseline="middle">
                {band.index + 1}
              </text>
            </g>
          );
        })}
      <rect x={0} y={PARAPET_H} width={width} height={count * BAND_H} className="ex-outline" />
    </svg>
  );
}
