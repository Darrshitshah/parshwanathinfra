/**
 * The visible "TBD" chip: every unconfirmed fact on the site renders through this so a gap in the data is obvious.
 * The chip reads "TBD" on screen and "TBD (to be confirmed)" to assistive technology.
 */
import { en } from "@/content/i18n/en";
import { cn } from "./cn";

export const TBD_TOKEN = "TBD";

export function Tbd({ className }: { className?: string }) {
  return (
    <span className={cn("chip-tbd", className)} title={en.common.tbdTitle} data-tbd="">
      {en.common.tbd}
      <span className="sr-only"> ({en.common.tbdSpoken})</span>
    </span>
  );
}
