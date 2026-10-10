/**
 * Typology filter state for the Living Plan. Port of the portfolio's `pjLink` behaviour as a pure reducer:
 * hover previews, a tap pins, Escape or a click on empty plan clears, and mixed use lights up partially with
 * flats and shops. Keys 1 to 4 pin a typology from the keyboard.
 */
export type FilterKey = "rowhouses" | "flats" | "shops" | "mixed";

export interface FilterDef {
  key: FilterKey;
  /** The keyboard digit and the number shown on the key. */
  n: 1 | 2 | 3 | 4;
  short: string;
  /** Typologies this one also lights up (and is partly lit by). */
  also: readonly FilterKey[];
}

export const FILTERS: readonly FilterDef[] = [
  { key: "rowhouses", n: 1, short: "Row houses", also: [] },
  { key: "flats", n: 2, short: "Flats", also: [] },
  { key: "shops", n: 3, short: "Shops", also: [] },
  { key: "mixed", n: 4, short: "Mixed use", also: ["flats", "shops"] },
];

export const FILTER_KEYS: readonly FilterKey[] = FILTERS.map((filter) => filter.key);

export interface FilterState {
  hover: FilterKey | null;
  pin: FilterKey | null;
}

export const INITIAL_FILTER: FilterState = { hover: null, pin: null };

export type FilterAction =
  | { type: "hover"; key: FilterKey }
  | { type: "unhover" }
  | { type: "tap"; key: FilterKey }
  | { type: "digit"; digit: string }
  | { type: "emptyClick" }
  | { type: "clear" };

export function isFilterKey(value: unknown): value is FilterKey {
  return typeof value === "string" && (FILTER_KEYS as readonly string[]).includes(value);
}

/** "1" to "4" mapped to a typology, anything else null. */
export function digitToFilter(digit: string): FilterKey | null {
  return FILTERS.find((filter) => String(filter.n) === digit)?.key ?? null;
}

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "hover":
      return state.hover === action.key ? state : { ...state, hover: action.key };
    case "unhover":
      return state.hover === null ? state : { ...state, hover: null };
    case "tap":
      return { hover: state.hover, pin: state.pin === action.key ? null : action.key };
    case "digit": {
      const key = digitToFilter(action.digit);
      return key ? { hover: null, pin: state.pin === key ? null : key } : state;
    }
    case "emptyClick":
      return state.pin === null ? state : { ...state, pin: null };
    case "clear":
      return state.hover === null && state.pin === null ? state : INITIAL_FILTER;
  }
}

/** The typology that is lit: a hover preview wins over the pin. */
export function activeFilter(state: FilterState): FilterKey | null {
  return state.hover ?? state.pin;
}

export type FilterRole = "idle" | "on" | "part" | "dim";

/** How an item of typology `itemKey` looks while `active` is lit. `also` is the item's own list of partners. */
export function filterRole(active: FilterKey | null, itemKey: string, also: readonly string[] = []): FilterRole {
  if (active === null) return "idle";
  if (itemKey === active) return "on";
  return also.includes(active) ? "part" : "dim";
}

/** Typologies a building of this type also belongs to (mixed use: flats and shops). */
export function alsoFor(typology: string): readonly FilterKey[] {
  return FILTERS.find((filter) => filter.key === typology)?.also ?? [];
}
