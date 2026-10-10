"use client";

import Image from "next/image";
import { useRef } from "react";
import { Magnetic, useHoverParallax } from "@/components/cursor";
import { getMedia } from "@/content/media";
import { useDeviceTier } from "@/lib/device-tier-provider";
import { LabSection } from "./lab-ui";

function Card({ cursor, label, children }: { cursor: Record<string, string>; label: string; children?: React.ReactNode }) {
  return (
    <div
      {...cursor}
      className="flex min-h-36 flex-col justify-between border border-line-strong bg-paper-raised p-4"
    >
      <span className="font-mono text-xs tracking-widest text-ink-muted uppercase">{label}</span>
      {children}
    </div>
  );
}

export function CursorSection() {
  const { finePointer, tier, ready } = useDeviceTier();
  const frameRef = useRef<HTMLDivElement>(null);
  useHoverParallax(frameRef);
  const picture = getMedia("row-house-street");
  const active = ready && finePointer && tier !== "C";

  return (
    <LabSection
      id="cursor"
      title="S8 cursor · Magnetic · hover parallax"
      note={
        <>
          A small circle that inverts what it is over, grows into a ring over links and buttons, and becomes a labelled disc
          over <code>data-cursor-label</code>. Text fields keep the native cursor. It only runs on a fine pointer and off Tier
          C: <strong>{active ? "active here" : "not active here (touch, Tier C or reduced motion)"}</strong>.
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card cursor={{ "data-cursor-label": "View" }} label='data-cursor-label="View"' />
        <Card cursor={{ "data-cursor-label": "Drag" }} label='data-cursor-label="Drag"' />
        <Card cursor={{ "data-cursor-label": "Explore" }} label='data-cursor-label="Explore"' />
        <Card cursor={{ "data-cursor": "grow" }} label='data-cursor="grow"' />
        <Card cursor={{ "data-cursor": "native" }} label='data-cursor="native"' />
        <Card cursor={{}} label="plain content: small inverting circle" />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <a href="#cursor" className="font-mono text-sm underline underline-offset-4">
          A link grows the circle
        </a>
        <button type="button" className="rounded-xs border border-line-strong px-4 py-2 font-mono text-xs tracking-widest uppercase">
          A button
        </button>
        <label className="flex items-center gap-2 font-mono text-xs">
          Text field (native cursor)
          <input type="text" className="border border-line-strong bg-paper px-2 py-1" placeholder="type here" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-8">
        <Magnetic>
          <a
            href="#cursor"
            className="inline-flex items-center bg-brick px-7 py-4 font-mono text-xs tracking-widest text-on-brick uppercase"
          >
            Magnetic CTA
          </a>
        </Magnetic>
        <div ref={frameRef} data-cursor-label="Explore" className="relative aspect-3/2 w-72 overflow-hidden bg-paper-sunk">
          <Image src={picture.src} alt={picture.alt} fill sizes="288px" className="object-cover" data-hover-parallax="" />
        </div>
      </div>
    </LabSection>
  );
}
