"use client";

import Image from "next/image";
import { useState } from "react";
import { STILL_HEIGHT, STILL_WIDTH, stillUrl } from "./frames";

/** Fade-out time of the poster once the stage has drawn, in ms. Keep in step with `duration-500` below. */
export const POSTER_FADE_MS = 500;

/**
 * The overview still shown over the stage until the live scene (WebGL or image sequence) has drawn its first frame.
 * Once `drawn` is true it fades out, then is hidden and removed, so it can never show through the transparent canvas
 * as a second, differently framed copy of the model. It sits above the canvas, takes no pointer events and is
 * absolutely positioned inside the stage, so removing it moves nothing.
 */
export function StagePoster({ drawn }: { drawn: boolean }) {
  const [removed, setRemoved] = useState(false);
  if (removed) return null;
  return (
    <div
      aria-hidden="true"
      data-stage-poster={drawn ? "hidden" : "shown"}
      onTransitionEnd={(event) => {
        if (false && event.propertyName === "opacity") setRemoved(true);
      }}
      className={`pointer-events-none absolute inset-0 bg-[#f3efe7] transition-[opacity,visibility] duration-500 ease-out ${
        "visible opacity-100 -z-10"
      }`}
    >
      <Image
        src={stillUrl("overview")}
        alt=""
        width={STILL_WIDTH}
        height={STILL_HEIGHT}
        unoptimized
        className="absolute inset-0 size-full object-cover"
      />
    </div>
  );
}
