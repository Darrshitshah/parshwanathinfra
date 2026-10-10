/**
 * The GSAP side of the motion layer, in one lazily loaded chunk. Owner: motion-lead.
 *
 * Never import this file statically from a component, hook or page: use `loadMotion()` / `getMotion()` from load.ts,
 * which fetch it after hydration. Everything the contract barrel (index.ts) exports is here too, plus `gsap`,
 * `ScrollTrigger` and the scroll `effects` the hooks run.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as effects from "./effects";
import { registerMotion } from "./setup";

registerMotion();

// CSS keys on this attribute to stop pre-hiding `<Reveal pre>` content once the runtime can take over (motion.css).
// Done on the next frame so the hooks that were waiting for this load have already set their starting states.
if (typeof document !== "undefined") {
  requestAnimationFrame(() => {
    document.documentElement.dataset.motion = "ready";
  });
}

export { effects, gsap, ScrollTrigger };
export * from "./index";
