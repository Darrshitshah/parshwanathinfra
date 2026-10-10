/**
 * Mono callouts over an image: numbered pins on small screens, pin + leader + label from the lg breakpoint.
 * Decorative (aria-hidden): the legend list next to each figure is the text equivalent, so nothing is said twice.
 * Positions are percentages of the image and come from src/content/copy/callouts.ts.
 */
import type { CSSProperties } from "react";
import type { CalloutSpec } from "@/content/copy/callouts";

export function Callouts({ items, desktopOnly = false }: { items: readonly CalloutSpec[]; desktopOnly?: boolean }) {
  return (
    <div
      className={desktopOnly ? "pointer-events-none absolute inset-0 hidden lg:block" : "pointer-events-none absolute inset-0"}
      aria-hidden="true"
      data-callouts=""
    >
      {items.map((item, index) => {
        const number = String(index + 1).padStart(2, "0");
        const style = {
          "--x": `${item.x}%`,
          "--y": `${item.y}%`,
          "--len": item.len,
        } as CSSProperties;
        return (
          <div key={item.id} className="callout" data-dir={item.dir} data-align={item.align ?? "start"} style={style}>
            <span className="callout__pin">{index + 1}</span>
            <span className="callout__leader" />
            <span className="callout__label">
              <b>{number}</b>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
