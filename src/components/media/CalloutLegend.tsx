/** The text equivalent of a figure's callouts: a numbered list that matches the pins on the image. */
import type { CalloutSpec } from "@/content/copy/callouts";
import { withTbd } from "@/components/ui/with-tbd";
import { cn } from "@/components/ui/cn";

export function CalloutLegend({
  items,
  className,
  label,
}: {
  items: readonly CalloutSpec[];
  className?: string;
  /** Accessible name of the list. */
  label: string;
}) {
  return (
    <ol className={cn("legend", className)} aria-label={label}>
      {items.map((item, index) => (
        <li key={item.id}>
          <span className="legend__n" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="t-small text-ink-muted">
            <strong className="text-ink">{item.label}.</strong> {withTbd(item.detail)}
          </span>
        </li>
      ))}
    </ol>
  );
}
