/**
 * Typical flat plan, area label 473 on the 2022 layout plan. Owner: data-lead.
 *
 * Rooms and sizes are the sheet's own labels (feet and inches), cut by tools/pdf/cut_units.py into
 * /plan/units/flat-473.svg. The sheet does not say whether 473 is a carpet, built-up or super built-up area in
 * square feet, so the area stays TBD, and so does the BHK type until Darshit confirms which plans are 1 BHK and 2 BHK.
 */
import { TBD, unitTypeSchema, type UnitType } from "../schema";

export const flat473: UnitType = unitTypeSchema.parse({
  id: "flat-473",
  typology: "flats",
  label: "Typical flat, plan 473",
  bhk: TBD,
  sheetLabel: "473",
  areaSqft: TBD,
  areaType: TBD,
  rooms: [
    { name: "Hall", width: "10'0\"", length: "15'4\"", widthM: 3.05, lengthM: 4.67 },
    { name: "Kitchen", width: "7'0\"", length: "8'0\"", widthM: 2.13, lengthM: 2.44 },
    { name: "Dining", width: "7'4\"", length: "7'4\"", widthM: 2.24, lengthM: 2.24 },
    { name: "Bedroom", width: "10'0\"", length: "10'6\"", widthM: 3.05, lengthM: 3.2 },
    { name: "Bath", width: "6'4\"", length: "3'6\"", widthM: 1.93, lengthM: 1.07 },
    { name: "W.C.", width: "3'6\"", length: "3'6\"", widthM: 1.07, lengthM: 1.07 },
  ],
  planSvg: "/plan/units/flat-473.svg",
  indicative: true,
});
