"use client";

import Image from "next/image";
import type { StageCaption } from "./captions";
import { STILL_HEIGHT, STILL_WIDTH, stillUrl } from "./frames";
import { StageBadges } from "./StageChrome";
import { dioramaStrings } from "./strings";

/** Tier C and reduced motion: the overview still with the chapter captions below it. No scripts, no pinning. */
export function StillFigure({ captions }: { captions: ReadonlyArray<StageCaption> }) {
  return (
    <figure className="m-0">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f3efe7] md:aspect-[16/8] lg:aspect-[21/9]">
        <Image
          src={stillUrl("overview")}
          alt={dioramaStrings.stageLabel}
          width={STILL_WIDTH}
          height={STILL_HEIGHT}
          sizes="100vw"
          unoptimized
          className="absolute inset-0 size-full object-cover"
        />
        <StageBadges />
      </div>
      <figcaption className="wrap mt-8">
        <ol className="m-0 grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3" aria-label={dioramaStrings.chapterList}>
          {captions.slice(1).map((c, i) => (
            <li key={c.id}>
              <span className="t-mono-sm text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="t-display-4 m-0 mt-1 text-ink">{c.title}</h3>
              <p className="t-small m-0 mt-2 text-ink-muted">{c.body}</p>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
