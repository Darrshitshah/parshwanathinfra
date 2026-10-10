/** Unit types cut from the 2022 layout plan. Owner: data-lead. Row-house plans do not exist yet (planSvg stays "TBD"). */
import type { UnitType } from "../schema";
import { flat473 } from "./flat-473";
import { flatLarge } from "./flat-large";

export const unitTypes: readonly UnitType[] = [flat473, flatLarge];

export function getUnitType(id: string): UnitType | undefined {
  return unitTypes.find((unit) => unit.id === id);
}
