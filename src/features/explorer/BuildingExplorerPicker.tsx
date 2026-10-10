"use client";

/**
 * The explorer on its own (the project page's `data-slot="explorer"`): choose a block from the plan, then explore it.
 * Blocks come from plan.json (flat blocks and the mixed-use building), grouped by sector.
 */
import { useId, useMemo, useState } from "react";
import { plan } from "@/content/plan";
import { BuildingExplorer } from "./BuildingExplorer";

function title(label: string | undefined, tag: string, id: string): string {
  return label ?? (tag === "TBD" ? id : tag);
}

export function BuildingExplorerPicker({ initialBuildingId }: { initialBuildingId?: string }) {
  const selectId = useId();
  const blocks = useMemo(
    () =>
      plan.buildings
        .filter((building) => building.typology === "flats" || building.typology === "mixed")
        .map((building) => ({ id: building.id, label: title(building.label, building.sheetTag, building.id), sector: building.sector })),
    [],
  );
  const [buildingId, setBuildingId] = useState(initialBuildingId && blocks.some((b) => b.id === initialBuildingId) ? initialBuildingId : (blocks[0]?.id ?? ""));
  const sectors = Array.from(new Set(blocks.map((block) => block.sector)));

  return (
    <div className="ex-picker">
      <label className="ex-picker__label" htmlFor={selectId}>
        Choose a block
      </label>
      <select id={selectId} className="ex-picker__select" value={buildingId} onChange={(event) => setBuildingId(event.target.value)}>
        {sectors.map((sector) => (
          <optgroup key={sector} label={sector === "TBD" ? "Sector not stated on the plan" : `Sector ${sector}`}>
            {blocks
              .filter((block) => block.sector === sector)
              .map((block) => (
                <option key={block.id} value={block.id}>
                  {block.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      {buildingId ? <BuildingExplorer key={buildingId} buildingId={buildingId} /> : null}
    </div>
  );
}
