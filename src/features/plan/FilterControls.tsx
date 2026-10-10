"use client";

/**
 * Typology keys 1 to 4 and the unit-mix bar. Counts come from the project record; the mixed-use count from the plan.
 * Hover, focus and tap behaviour is delegated at the plan root (see LivingPlan): every element here only carries
 * `data-t`, exactly like the footprints on the drawing, so they light up together.
 */
import { buildingsByTypology } from "@/content/plan";
import { shivShiva } from "@/content/projects";
import { FILTERS, type FilterKey } from "./filter-state";
import { planStrings } from "./strings";

const fmt = (value: number) => value.toLocaleString("en-IN");

export interface MixEntry {
  key: FilterKey;
  n: number;
  short: string;
  /** Units, for the three counted typologies. Mixed use has no count of its own. */
  value: number | null;
  detail: string;
}

export function mixEntries(): MixEntry[] {
  const counts: Record<Exclude<FilterKey, "mixed">, number> = {
    rowhouses: shivShiva.counts.rowHouses,
    flats: shivShiva.counts.flats,
    shops: shivShiva.counts.shops,
  };
  return FILTERS.map((filter) => ({
    key: filter.key,
    n: filter.n,
    short: filter.short,
    value: filter.key === "mixed" ? null : counts[filter.key],
    detail: filter.key === "mixed" ? planStrings.mixedNote : "units",
  }));
}

export function mixTotal(): number {
  return shivShiva.counts.total;
}

export function FilterControls({ pinned }: { pinned: FilterKey | null }) {
  const entries = mixEntries();
  const counted = entries.filter((entry) => entry.value !== null);
  const mixedBuildings = buildingsByTypology("mixed").length;
  const summary = counted.map((entry) => `${entry.short} ${fmt(entry.value ?? 0)}`).join(", ");

  return (
    <div className="lp-mix">
      <div className="lp-bar" role="img" aria-label={`${planStrings.mixLabel}: ${summary}, total ${fmt(mixTotal())}`}>
        {counted.map((entry) => (
          <span key={entry.key} className="lp-seg" data-t={entry.key} style={{ flex: `${entry.value} 1 0` }}>
            <i>{entry.n}</i>
          </span>
        ))}
      </div>
      <div className="lp-keys" role="group" aria-label={planStrings.keysLabel}>
        {entries.map((entry) => (
          <button
            key={entry.key}
            type="button"
            className="lp-key"
            data-t={entry.key}
            data-also={entry.key === "mixed" ? "flats shops" : undefined}
            aria-pressed={pinned === entry.key}
            aria-keyshortcuts={String(entry.n)}
          >
            <i className="lp-key__n" aria-hidden="true">
              {entry.n}
            </i>
            <span className="lp-key__l">{entry.short}</span>
            <b className="lp-key__v">{entry.value === null ? planStrings.mixedCount(mixedBuildings) : fmt(entry.value)}</b>
          </button>
        ))}
        <div className="lp-key lp-key--total">
          <span className="lp-key__l">{planStrings.total}</span>
          <b className="lp-key__v">{fmt(mixTotal())}</b>
        </div>
      </div>
    </div>
  );
}
