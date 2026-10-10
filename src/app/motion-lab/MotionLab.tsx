"use client";

import { useState } from "react";
import { useDeviceTier } from "@/lib/device-tier-provider";
import { BlindsSection } from "./BlindsSection";
import { CursorSection } from "./CursorSection";
import { DimensionSection } from "./DimensionSection";
import { InkSection } from "./InkSection";
import { LabDebug } from "./LabDebug";
import { IrisSection } from "./IrisSection";
import { LabContext } from "./lab-ui";
import { LoaderSection } from "./LoaderSection";
import { ScrollSection } from "./ScrollSection";
import { SplitSection } from "./SplitSection";
import { TransitionSection } from "./TransitionSection";
import { WipeSection } from "./WipeSection";

const NAV = [
  ["transition", "Transition"],
  ["ink", "inkDraw"],
  ["split", "splitReveal"],
  ["dimension", "dimensionCount"],
  ["iris", "roundaboutIris"],
  ["wipe", "boulevardWipe"],
  ["blinds", "stripBlinds"],
  ["loader", "Loader"],
  ["cursor", "Cursor"],
  ["scroll", "Scroll hooks"],
] as const;

/** Dev-only review page for the motion system. Every primitive has a replay button; nothing here ships. */
export function MotionLab() {
  const device = useDeviceTier();
  const [reduced, setReduced] = useState(false);

  return (
    <LabContext.Provider value={{ reduced }}>
      <LabDebug />
      <div className="mx-auto max-w-5xl space-y-12 px-(--gutter) py-16">
        <header className="space-y-5">
          <p className="font-mono text-xs tracking-widest text-brick uppercase">Dev only · not part of the site</p>
          <h1 className="font-display text-6xl leading-none text-ink">Motion lab</h1>
          <p className="max-w-(--measure) text-ink-muted">
            Every primitive in <code>src/motion</code>, the page curtain, the S1 loader and the S8 cursor, each with a replay
            button. Open it at 360 px and at 1440 px, and with reduced motion switched on in your system settings.
          </p>

          <dl className="grid max-w-3xl grid-cols-2 gap-x-8 gap-y-2 font-mono text-xs sm:grid-cols-4" data-testid="device">
            <div>
              <dt className="text-ink-muted">Tier</dt>
              <dd data-testid="tier">{device.ready ? device.tier : "detecting"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Reduced motion (OS)</dt>
              <dd>{String(device.reducedMotion)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Fine pointer</dt>
              <dd>{String(device.finePointer)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Lenis smooth scroll</dt>
              <dd>{String(device.smoothScroll)}</dd>
            </div>
          </dl>

          <label className="flex items-center gap-3 font-mono text-xs tracking-widest uppercase">
            <input type="checkbox" checked={reduced} onChange={(event) => setReduced(event.target.checked)} />
            Preview the reduced-motion path of the primitives
          </label>

          <nav aria-label="Sections" className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="underline underline-offset-4">
                {label}
              </a>
            ))}
          </nav>
        </header>

        <TransitionSection />
        <InkSection />
        <SplitSection />
        <DimensionSection />
        <IrisSection />
        <WipeSection />
        <BlindsSection />
        <LoaderSection />
        <CursorSection />
        <ScrollSection />

        <footer className="space-y-2 border-t border-line pt-8 text-sm text-ink-muted">
          <h2 className="font-mono text-sm tracking-widest text-ink uppercase">Reduced motion</h2>
          <p className="max-w-(--measure)">
            With <code>prefers-reduced-motion: reduce</code> the device is Tier C: no smooth scroll, no curtain, no cursor, no
            parallax, no pinning, and the scroll hooks leave the content exactly as rendered. The loader shows a static
            outline and fades. Every primitive also has a reduced path (a quick fade or the end state), which the checkbox
            above previews on any tier.
          </p>
        </footer>
      </div>
    </LabContext.Provider>
  );
}
