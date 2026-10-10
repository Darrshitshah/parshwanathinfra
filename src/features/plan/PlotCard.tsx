"use client";

/**
 * The plot card: opens when a plot is tapped on the plan, from the number box or from the list. Everything shown is
 * read from content: the plot (type, confidence), the inventory (status) and the row-house elevation render.
 */
import { useEffect, useRef } from "react";
import { Figure } from "@/components/media/Figure";
import { Tbd } from "@/components/ui/Tbd";
import { getMedia } from "@/content/media";
import { plotByNumber } from "@/content/plan";
import { shivShiva } from "@/content/projects";
import { EnquireButton } from "@/components/ui/EnquireButton";
import { interestForPlotType } from "@/features/enquiry";
import { plotStatus } from "./twin-data";
import { planStrings } from "./strings";

const TYPE_LABEL: Record<string, string> = { "2BHK": "2 BHK", "3BHK": "3 BHK" };
const STATUS_LABEL: Record<string, string> = { available: "Available", booked: "Booked", sold: "Sold" };

export interface PlotCardContent {
  number: number;
  typeLabel: string | null;
  statusLabel: string | null;
  indicative: boolean;
  interest: ReturnType<typeof interestForPlotType>;
}

/** What the card says about a plot, from data. Null for a number that is not on the plan. */
export function plotCardContent(number: number): PlotCardContent | null {
  const plot = plotByNumber(number);
  if (!plot) return null;
  const status = plotStatus(number);
  return {
    number,
    typeLabel: TYPE_LABEL[plot.type] ?? null,
    statusLabel: STATUS_LABEL[status] ?? null,
    indicative: plot.numberConfidence === "low",
    interest: interestForPlotType(plot.type),
  };
}

export function PlotCard({ number, onClose, inline = false }: { number: number; onClose: () => void; inline?: boolean }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const content = plotCardContent(number);

  useEffect(() => {
    headingRef.current?.focus();
  }, [number]);

  if (!content) return null;
  const elevation = getMedia("row-houses-day");

  return (
    <aside className={inline ? "lp-card lp-card--inline" : "lp-card"} role="dialog" aria-modal="false" aria-labelledby="lp-plot-title" data-no-pan="">
      <div className="lp-card__head">
        <h3 id="lp-plot-title" ref={headingRef} tabIndex={-1} className="lp-card__title">
          {planStrings.plotCard.title(content.number)}
        </h3>
        <button type="button" className="lp-card__close" onClick={onClose} aria-label={planStrings.plotCard.close}>
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <dl className="lp-card__facts">
        <div>
          <dt>{planStrings.plotCard.type}</dt>
          <dd>{content.typeLabel ?? <Tbd />}</dd>
        </div>
        <div>
          <dt>{planStrings.plotCard.status}</dt>
          <dd>{content.statusLabel ?? <Tbd />}</dd>
        </div>
      </dl>
      {content.indicative ? <p className="lp-card__note">{planStrings.plotCard.indicative}</p> : null}
      <div className="lp-card__figure">
        <Figure media={elevation} sizes="(min-width: 640px) 320px, calc(100vw - 4rem)" caption={elevation.caption} />
      </div>
      <EnquireButton prefill={{ project: shivShiva.slug, interest: content.interest, plot: content.number }} className="lp-card__cta">
        {planStrings.plotCard.enquire(content.number)}
      </EnquireButton>
    </aside>
  );
}
