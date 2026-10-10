/**
 * Plugins that most pages never need are loaded on first use, so they stay out of the initial bundle
 * (BUILD_SPEC section 11). Each loader registers the plugin once and resolves to it.
 *
 *   const Flip = await loadFlip();
 *   const state = Flip.getState(card);
 */
import { gsap } from "gsap";
import { registerMotion } from "./setup";

type FlipPlugin = typeof import("gsap/Flip").Flip;
type MorphSVGPluginType = typeof import("gsap/MorphSVGPlugin").MorphSVGPlugin;
type ObserverPlugin = typeof import("gsap/Observer").Observer;

let flipPromise: Promise<FlipPlugin> | undefined;
let morphPromise: Promise<MorphSVGPluginType> | undefined;
let observerPromise: Promise<ObserverPlugin> | undefined;

/** Flip: shared-element transitions (a card image expands into the project hero). */
export function loadFlip(): Promise<FlipPlugin> {
  registerMotion();
  flipPromise ??= import("gsap/Flip").then(({ Flip }) => {
    gsap.registerPlugin(Flip);
    return Flip;
  });
  return flipPromise;
}

/** MorphSVG: shape-to-shape morphs. */
export function loadMorphSVG(): Promise<MorphSVGPluginType> {
  registerMotion();
  morphPromise ??= import("gsap/MorphSVGPlugin").then(({ MorphSVGPlugin }) => {
    gsap.registerPlugin(MorphSVGPlugin);
    return MorphSVGPlugin;
  });
  return morphPromise;
}

/** Observer: wheel, touch and pointer gestures (horizontal galleries, drag). */
export function loadObserver(): Promise<ObserverPlugin> {
  registerMotion();
  observerPromise ??= import("gsap/Observer").then(({ Observer }) => {
    gsap.registerPlugin(Observer);
    return Observer;
  });
  return observerPromise;
}
