/**
 * Page transitions (BUILD_SPEC S7). Owner: motion-lead.
 *
 * Mounted once by `MotionRoot`. Plain `next/link` works as is. Optional pieces for other leads:
 *   usePageTransition()    cover / reveal on their own, navigate with the curtain from code
 *   useTransitionRouter()  `useRouter()` whose push and replace play the curtain
 * Link attributes:
 *   data-transition-title="Plan a visit"   the word that slides through the curtain (default: from the path)
 *   data-transition-ignore                 on a link or any ancestor: never intercept
 */
export { TransitionProvider, type TransitionProviderProps } from "./TransitionProvider";
export {
  usePageTransition,
  useTransitionRouter,
  type NavigateOptions,
  type NavigateResult,
  type TransitionApi,
  type TransitionRouterOptions,
} from "./context";
