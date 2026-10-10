/**
 * The larger flat plan on the 2022 layout plan (hall 17'0" x 10'0", vestibule, master bedroom). Owner: data-lead.
 *
 * Sizes are the sheet's labels, cut by tools/pdf/cut_units.py into /plan/units/flat-large.svg. Its area label is drawn
 * as vector glyphs on the sheet and cannot be read reliably, so no sheet label, area or BHK type is given: all TBD.
 */
import { TBD, unitTypeSchema, type UnitType } from "../schema";

export const flatLarge: UnitType = unitTypeSchema.parse({
  id: "flat-large",
  typology: "flats",
  label: "Larger flat plan, with vestibule and master bedroom",
  bhk: TBD,
  areaSqft: TBD,
  areaType: TBD,
  rooms: [
    { name: "Hall", width: "17'0\"", length: "10'0\"", widthM: 5.18, lengthM: 3.05 },
    { name: "Vestibule", width: "4'6\"", length: "4'6\"", widthM: 1.37, lengthM: 1.37 },
    { name: "Kitchen and dining", width: "15'6\"", length: "8'6\"", widthM: 4.72, lengthM: 2.59 },
    { name: "Store", width: "4'6\"", length: "5'0\"", widthM: 1.37, lengthM: 1.52 },
    { name: "Bedroom", width: "10'0\"", length: "10'0\"", widthM: 3.05, lengthM: 3.05 },
    { name: "Master bedroom", width: "11'6\"", length: "10'0\"", widthM: 3.51, lengthM: 3.05 },
    { name: "Toilet", width: "6'10\"", length: "4'0\"", widthM: 2.08, lengthM: 1.22 },
    { name: "Bath", width: "6'10\"", length: "3'6\"", widthM: 2.08, lengthM: 1.07 },
    { name: "W.C.", width: "3'6\"", length: "3'6\"", widthM: 1.07, lengthM: 1.07 },
    { name: "Wash", width: "5'0\"", length: "4'0\"", widthM: 1.52, lengthM: 1.22 },
  ],
  planSvg: "/plan/units/flat-large.svg",
  indicative: true,
});
