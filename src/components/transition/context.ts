"use client";

/**
 * Optional programmatic access to the page transition. Owner: motion-lead.
 *
 * Plain `next/link` needs none of this: the provider takes over internal link clicks by itself.
 * Use these only when code (not a link) navigates, e.g. after a form succeeds:
 *
 *   const router = useTransitionRouter();
 *   router.push("/thank-you", { title: "Thank you" });
 *
 * or when you want the curtain on its own (`cover` then `reveal`).
 */
import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo } from "react";

export type NavigateResult = "started" | "busy" | "disabled";

export interface NavigateOptions {
  /** The word that slides through the curtain. Default: derived from the destination path. */
  title?: string;
  replace?: boolean;
}

export interface TransitionApi {
  /** True on Tier A and B without reduced motion: link clicks get the curtain. */
  enabled: boolean;
  /** Navigate with the curtain. "disabled" means nothing happened and you should navigate normally. */
  navigate(href: string, options?: NavigateOptions): NavigateResult;
  /** Play the cover alone; resolves when the page is hidden. Always call `reveal()` afterwards. */
  cover(title?: string): Promise<void>;
  /** Open the curtain; resolves when it is gone. */
  reveal(): Promise<void>;
  isBusy(): boolean;
}

const INACTIVE: TransitionApi = {
  enabled: false,
  navigate: () => "disabled",
  cover: () => Promise.resolve(),
  reveal: () => Promise.resolve(),
  isBusy: () => false,
};

export const TransitionContext = createContext<TransitionApi>(INACTIVE);

export function usePageTransition(): TransitionApi {
  return useContext(TransitionContext);
}

export interface TransitionRouterOptions extends NavigateOptions {
  scroll?: boolean;
}

/**
 * `useRouter()` whose `push` and `replace` play the curtain when it is available, and navigate plainly otherwise.
 * They return false only when a transition is already running and the call was ignored (like a second link click).
 */
export function useTransitionRouter() {
  const router = useRouter();
  const transition = usePageTransition();

  return useMemo(() => {
    const go = (method: "push" | "replace", href: string, options: TransitionRouterOptions = {}): boolean => {
      const result = transition.navigate(href, { title: options.title, replace: method === "replace" });
      if (result === "started") return true;
      if (result === "busy") return false;
      const routerOptions = options.scroll === undefined ? undefined : { scroll: options.scroll };
      router[method](href, routerOptions);
      return true;
    };
    return {
      push: (href: string, options?: TransitionRouterOptions) => go("push", href, options),
      replace: (href: string, options?: TransitionRouterOptions) => go("replace", href, options),
      back: () => router.back(),
      forward: () => router.forward(),
      refresh: () => router.refresh(),
      prefetch: (href: string) => router.prefetch(href),
    };
  }, [router, transition]);
}
