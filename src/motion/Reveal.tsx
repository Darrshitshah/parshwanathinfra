"use client";

/**
 * Drop-in components for the scroll hooks, so a section can opt into motion without writing GSAP.
 * Owner: motion-lead.
 *
 *   <Reveal kind="split" as="h2" className="font-display text-5xl">Drawn to life</Reveal>
 *   <Reveal kind="fade">...any block...</Reveal>
 *   <Reveal kind="ink"><svg>...stroked shapes...</svg></Reveal>
 *   <Reveal kind="blinds"><figure data-blinds-item>...</figure><figure data-blinds-item>...</figure></Reveal>
 *   <Reveal kind="wipe">...content uncovered behind a line that draws across...</Reveal>
 *   <DimensionStat value={1565} label="Homes" />
 *   <Parallax amount={8}><img className="h-full w-full object-cover" .../></Parallax>
 *
 * All of them render complete, readable content on the server and with JavaScript off; the hooks only enhance it.
 */
import { useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import {
  useBoulevardWipe,
  useDimensionCount,
  useFadeReveal,
  useInkDraw,
  useParallax,
  useSplitReveal,
  useStripBlinds,
  type BoulevardWipeHookOptions,
  type DimensionCountHookOptions,
  type FadeRevealHookOptions,
  type InkDrawHookOptions,
  type SplitRevealHookOptions,
  type StripBlindsHookOptions,
} from "./hooks";

interface CommonProps {
  /** Element to render, default "div". */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  id?: string;
  children?: ReactNode;
  /**
   * Hide the content with CSS until the motion runtime has loaded, so above-the-fold content never shows once and then
   * replays. Off by default because it delays the content's first appearance by the runtime's load time (and it
   * is released after 3.5 s if JavaScript never arrives). Do not use it on the LCP element.
   */
  pre?: boolean;
}

export type RevealProps =
  | ({ kind: "split" } & SplitRevealHookOptions & CommonProps)
  | ({ kind: "ink" } & InkDrawHookOptions & CommonProps)
  | ({ kind: "blinds" } & StripBlindsHookOptions & CommonProps)
  | ({ kind: "wipe" } & BoulevardWipeHookOptions & CommonProps)
  | ({ kind?: "fade" } & FadeRevealHookOptions & CommonProps);

function SplitReveal({
  as: Tag = "div",
  children,
  className,
  style,
  id,
  pre,
  by,
  stagger,
  start,
  delay,
  duration,
}: Extract<RevealProps, { kind: "split" }>) {
  const ref = useRef<HTMLElement>(null);
  useSplitReveal(ref, { by, stagger, start, delay, duration });
  return (
    <Tag ref={ref} className={className} style={style} id={id} data-reveal-pre={pre ? "" : undefined}>
      {children}
    </Tag>
  );
}

function InkReveal({
  as: Tag = "div",
  children,
  className,
  style,
  id,
  pre,
  stagger,
  start,
  delay,
  duration,
}: Extract<RevealProps, { kind: "ink" }>) {
  const ref = useRef<HTMLElement>(null);
  useInkDraw(ref, { stagger, start, delay, duration });
  return (
    <Tag ref={ref} className={className} style={style} id={id} data-reveal-pre={pre ? "" : undefined}>
      {children}
    </Tag>
  );
}

function BlindsReveal({
  as: Tag = "div",
  children,
  className,
  style,
  id,
  pre,
  strips,
  orientation,
  start,
  delay,
  duration,
}: Extract<RevealProps, { kind: "blinds" }>) {
  const ref = useRef<HTMLElement>(null);
  useStripBlinds(ref, { strips, orientation, start, delay, duration });
  return (
    <Tag ref={ref} className={className} style={style} id={id} data-reveal-pre={pre ? "" : undefined}>
      {children}
    </Tag>
  );
}

function WipeReveal({
  as: Tag = "div",
  children,
  className,
  style,
  id,
  pre,
  direction,
  mode,
  start,
  delay,
  duration,
}: Extract<RevealProps, { kind: "wipe" }>) {
  const ref = useRef<HTMLElement>(null);
  const hasContent = children !== undefined && children !== null && children !== false;
  const resolvedMode = mode ?? (hasContent ? "reveal" : "line");
  useBoulevardWipe(ref, { direction, mode: resolvedMode, start, delay, duration });

  if (resolvedMode === "line") {
    return (
      <Tag ref={ref} className={className} style={style} id={id} data-reveal-pre={pre ? "" : undefined}>
        {children}
      </Tag>
    );
  }
  return (
    <Tag ref={ref} className={className} style={{ position: "relative", ...style }} id={id} data-reveal-pre={pre ? "" : undefined}>
      <span
        data-wipe-line=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 block h-px bg-brick"
      />
      <div data-wipe-content="">{children}</div>
    </Tag>
  );
}

function FadeReveal({
  as: Tag = "div",
  children,
  className,
  style,
  id,
  pre,
  y,
  start,
  delay,
  duration,
}: Extract<RevealProps, { kind?: "fade" }>) {
  const ref = useRef<HTMLElement>(null);
  useFadeReveal(ref, { y, start, delay, duration });
  return (
    <Tag ref={ref} className={className} style={style} id={id} data-reveal-pre={pre ? "" : undefined}>
      {children}
    </Tag>
  );
}

/** Opt a block into a scroll-triggered reveal. `kind` picks the effect (default "fade"). See the file header for each. */
export function Reveal(props: RevealProps) {
  switch (props.kind) {
    case "split":
      return <SplitReveal {...props} />;
    case "ink":
      return <InkReveal {...props} />;
    case "blinds":
      return <BlindsReveal {...props} />;
    case "wipe":
      return <WipeReveal {...props} />;
    default:
      return <FadeReveal {...props} />;
  }
}

/* ------------------------------------------------------------------------------------------------ */

export interface DimensionStatProps extends DimensionCountHookOptions {
  value: number;
  /** What is being counted, e.g. "Homes". Pass real copy only; it renders as given. */
  label: ReactNode;
  className?: string;
  /** The server-rendered number. Defaults to the Indian-grouped value. */
  formatted?: string;
}

/**
 * A stat drawn as a CAD dimension: end ticks, a line, and the number counting up inside it.
 * The number sits on the line with the paper colour behind it (`--dim-surface`, default `--paper`) so the line
 * reads as broken around it. The drawing follows `currentColor`. The width of the number is reserved by markup.
 */
export function DimensionStat({ value, label, className, formatted, ...options }: DimensionStatProps) {
  const ref = useRef<HTMLElement>(null);
  useDimensionCount(ref, value, options);
  const text = formatted ?? new Intl.NumberFormat("en-IN", { maximumFractionDigits: options.decimals ?? 0 }).format(value);

  return (
    <figure ref={ref} className={["m-0 text-ink", className].filter(Boolean).join(" ")}>
      <div className="relative flex h-10 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" focusable="false">
          <line data-dim-tick="" x1="0.5" x2="0.5" y1="6" y2="34" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line data-dim-line="" x1="0" x2="100%" y1="20" y2="20" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line data-dim-tick="" x1="99.9%" x2="99.9%" y1="6" y2="34" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* the sizer holds the final number invisibly, so the cell is as wide as the final text while the digits count */}
        <span className="relative grid bg-[var(--dim-surface,var(--paper))] px-3 font-mono text-2xl tracking-tight tabular-nums md:text-3xl">
          <span aria-hidden="true" className="invisible col-start-1 row-start-1">
            {text}
          </span>
          <span data-dim-output="" className="col-start-1 row-start-1 text-center">
            {text}
          </span>
        </span>
      </div>
      <figcaption className="mt-2 text-center font-mono text-xs tracking-widest text-ink-muted uppercase">{label}</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------------------------------------ */

export interface ParallaxProps {
  /** Travel each way, percent of the picture's height (default 8). */
  amount?: number;
  className?: string;
  children: ReactNode;
}

/**
 * A clipped frame whose single child drifts slowly as the page scrolls (Tier A only; elsewhere it sits still).
 * Give the child `h-full w-full object-cover`. The frame takes its size from `className`.
 */
export function Parallax({ amount = 8, className, children }: ParallaxProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  useParallax(innerRef, amount);
  return (
    <div className={["relative overflow-hidden", className].filter(Boolean).join(" ")}>
      <div ref={innerRef} className="h-full w-full will-change-transform">
        {children}
      </div>
    </div>
  );
}
