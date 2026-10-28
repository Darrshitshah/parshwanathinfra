/**
 * The plan, static (S3 Living Plan mounts at data-slot="living-plan"). A top-down render of the whole township with
 * a few round pins, a text legend that doubles as the accessible description, and a link into the full plan.
 * Used on Home (split layout) and on the project page (wide layout, id="plan"). The static figure sits in
 * [data-fallback="static"], which the interactive plan replaces on capable devices. Owner: pages-lead.
 */
import { CalloutLegend } from "@/components/media/CalloutLegend";
import { Figure } from "@/components/media/Figure";
import { cn } from "@/components/ui/cn";
import { Eyebrow } from "@/components/ui/Section";
import { TextLink } from "@/components/ui/TextLink";
import { rich } from "@/components/ui/with-tbd";
import { planCallouts } from "@/content/copy/callouts";
import { homeCopy } from "@/content/copy/home";
import { en } from "@/content/i18n/en";
import { getMedia } from "@/content/media";
import { LivingPlanSlot } from "@/features/plan";

interface PlanSectionProps {
  id?: string;
  /** Detail marker number shown in the eyebrow. */
  index?: string;
  /** "split": heading beside the figure (Home). "wide": heading above a full-width figure (project page). */
  layout?: "split" | "wide";
  /** Link to the full plan (hidden on the project page, where the plan already is). */
  showLink?: boolean;
  /** Colour block: the calm mist band (default) or plain ivory. */
  tone?: "mist" | "paper";
}

export function PlanSection({ id = "plan", index = "03", layout = "split", showLink = true, tone = "mist" }: PlanSectionProps) {
  const topdown = getMedia("masterplan-topdown");
  const split = layout === "split";

  const copy = (
    <div className={split ? "lg:col-span-4" : "grid gap-6 lg:grid-cols-12 lg:gap-x-(--gutter)"}>
      <h2 id={`${id}-title`} className={split ? "t-display-2 text-ink" : "t-display-2 text-ink lg:col-span-6"}>
        {rich(homeCopy.plan.heading)}
      </h2>
      <div className={split ? "mt-6" : "lg:col-span-5 lg:col-start-8"}>
        <p className="t-lead m-0 text-ink-muted">{rich(homeCopy.plan.body)}</p>
        {showLink ? (
          <p className="mt-8">
            <TextLink href="/projects/shiv-shiva#plan" arrow="right">
              {en.common.explorePlan}
            </TextLink>
          </p>
        ) : null}
      </div>
    </div>
  );

  const figure = (
    <div className={split ? "min-w-0 lg:col-span-8" : "min-w-0"} data-cursor-label="Explore">
      <LivingPlanSlot mode={split ? "story" : "explore"}>
        <div data-fallback="static">
          <Figure
            media={topdown}
            sizes={split ? "(min-width: 1408px) 860px, (min-width: 1024px) 62vw, calc(100vw - 2rem)" : "(min-width: 1408px) 1328px, calc(100vw - 2rem)"}
            callouts={planCallouts}
            caption={homeCopy.plan.figureCaption}
          />
        </div>
      </LivingPlanSlot>
    </div>
  );

  return (
    <section id={id} data-slot="living-plan" aria-labelledby={`${id}-title`} className={cn("sheet", tone === "mist" ? "tone-mist" : "tone-paper")}>
      <div className="wrap">
        <Eyebrow index={index} note={homeCopy.plan.note}>
          {homeCopy.plan.eyebrow}
        </Eyebrow>
        {split ? (
          <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 md:mt-14 lg:grid-cols-12 lg:gap-x-(--gutter)">
            {copy}
            {figure}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 md:mt-14">
            {copy}
            {figure}
          </div>
        )}
        <div className="mt-12 lg:mt-16">
          <p className="t-mono-sm m-0 mb-6 text-ink-muted">{homeCopy.plan.legendTitle}</p>
          <CalloutLegend items={planCallouts} label={homeCopy.plan.legendTitle} className="md:grid-cols-2 md:gap-x-10 lg:grid-cols-3" />
        </div>
      </div>
    </section>
  );
}
