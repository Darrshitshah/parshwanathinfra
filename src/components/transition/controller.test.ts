// @vitest-environment jsdom
/**
 * The page-transition state machine, driven with a fake GSAP runtime and fake timers. What is checked here are the
 * guarantees the work order names: the push never comes later than 900 ms after the click, a second click is
 * ignored, Back / a foreign route change aborts, the curtain always opens in the end, and nothing is left running.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MotionRuntime } from "@/motion/load";
import {
  COVER_PUSH_LIMIT_MS,
  createTransitionController,
  LOCATION_POLL_MS,
  MANUAL_LIMIT_MS,
  SAME_LOCATION_GRACE_MS,
  REVEAL_LIMIT_MS,
  ROUTE_WAIT_LIMIT_MS,
  TITLE_HOLD_MS,
  type ControllerEnv,
} from "./controller";

interface FakeTimeline {
  duration: () => number;
  time: () => number;
  progress: ReturnType<typeof vi.fn>;
  kill: ReturnType<typeof vi.fn>;
  eventCallback: ReturnType<typeof vi.fn>;
  complete: () => void;
}

function fakeTimeline(remainingSeconds = 0.7): FakeTimeline {
  let onComplete: (() => void) | undefined;
  const timeline: FakeTimeline = {
    duration: () => remainingSeconds + 0.2,
    time: () => 0.2,
    progress: vi.fn(() => timeline),
    kill: vi.fn(),
    eventCallback: vi.fn((name: string, handler: () => void) => {
      if (name === "onComplete") onComplete = handler;
      return timeline;
    }),
    complete: () => onComplete?.(),
  };
  return timeline;
}

interface Curtain {
  phase: "cover" | "reveal";
  timeline: FakeTimeline;
  onCovered?: () => void;
}

function setup(overrides: Partial<ControllerEnv> = {}) {
  const root = document.createElement("div");
  const label = document.createElement("span");
  const curtains: Curtain[] = [];
  const runtime = {
    boundaryCurtain: vi.fn((_root: Element, options: { phase: "cover" | "reveal"; onCovered?: () => void }) => {
      const curtain: Curtain = { phase: options.phase, timeline: fakeTimeline(), onCovered: options.onCovered };
      curtains.push(curtain);
      return curtain.timeline;
    }),
  } as unknown as MotionRuntime;
  const env = {
    runtime: () => runtime,
    root: () => root,
    label: () => label,
    hole: () => null,
    variant: () => "panel" as const,
    reduced: () => false,
    push: vi.fn(),
    prefetch: vi.fn(),
    arrived: vi.fn(),
    ...overrides,
  } satisfies ControllerEnv;
  const controller = createTransitionController(env);
  return { controller, env, root, label, curtains, runtime };
}

const flag = () => document.documentElement.dataset.transition ?? "idle";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] });
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  vi.useRealTimers();
  delete document.documentElement.dataset.transition;
});

describe("starting a transition", () => {
  it("plays the cover with the destination's title and prefetches the route", () => {
    const { controller, env, label, curtains } = setup();
    expect(controller.start("/about", { title: "About" })).toBe("started");
    expect(label.textContent).toBe("About");
    expect(curtains).toHaveLength(1);
    expect(curtains[0].phase).toBe("cover");
    expect(env.prefetch).toHaveBeenCalledWith("/about");
    expect(flag()).toBe("covering");
    expect(controller.isBusy()).toBe(true);
  });

  it("does nothing without the GSAP runtime or without the curtain: the link then behaves normally", () => {
    expect(setup({ runtime: () => null }).controller.start("/about", { title: "About" })).toBe("unavailable");
    expect(setup({ root: () => null }).controller.start("/about", { title: "About" })).toBe("unavailable");
  });

  it("ignores a second click while one is running", () => {
    const { controller, curtains } = setup();
    controller.start("/about", { title: "About" });
    expect(controller.start("/contact", { title: "Contact" })).toBe("busy");
    expect(curtains).toHaveLength(1);
  });
});

describe("navigating", () => {
  it("pushes once, the moment the page is covered", () => {
    const { controller, env, curtains } = setup();
    controller.start("/about#team", { title: "About" });
    expect(env.push).not.toHaveBeenCalled();
    curtains[0].onCovered?.();
    expect(env.push).toHaveBeenCalledTimes(1);
    expect(env.push).toHaveBeenCalledWith("/about#team", false);
    expect(flag()).toBe("covered");
    curtains[0].onCovered?.();
    expect(env.push).toHaveBeenCalledTimes(1);
  });

  it("passes replace through", () => {
    const { controller, env, curtains } = setup();
    controller.start("/about", { title: "About", replace: true });
    curtains[0].onCovered?.();
    expect(env.push).toHaveBeenCalledWith("/about", true);
  });

  it("never delays the push beyond the 900 ms cap, even if the animation stalls", () => {
    expect(COVER_PUSH_LIMIT_MS).toBeLessThan(1500);
    const { controller, env } = setup();
    controller.start("/about", { title: "About" });
    vi.advanceTimersByTime(COVER_PUSH_LIMIT_MS - 1);
    expect(env.push).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(env.push).toHaveBeenCalledTimes(1);
  });

  it("falls back to a full page load if the router throws", () => {
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", { value: { ...original, assign, pathname: "/", href: "http://localhost/" }, configurable: true });
    try {
      const { controller, curtains } = setup({
        push: () => {
          throw new Error("router unavailable");
        },
      });
      controller.start("/about", { title: "About" });
      curtains[0].onCovered?.();
      expect(assign).toHaveBeenCalledWith("/about");
    } finally {
      Object.defineProperty(window, "location", { value: original, configurable: true });
    }
  });
});

describe("opening the curtain", () => {
  it("reveals after the new route arrives, once the cover has finished and the title has been readable", () => {
    const { controller, env, curtains } = setup();
    controller.start("/about#team", { title: "About" });
    curtains[0].onCovered?.();

    controller.notifyPathname("/about");
    expect(env.arrived).toHaveBeenCalledWith("#team");
    expect(curtains).toHaveLength(1);

    // the fake cover has 0.7 s left; the title then holds for TITLE_HOLD_MS
    vi.advanceTimersByTime(700 + TITLE_HOLD_MS - 1);
    expect(curtains).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(curtains).toHaveLength(2);
    expect(curtains[1].phase).toBe("reveal");
    expect(flag()).toBe("revealing");

    curtains[1].timeline.complete();
    expect(flag()).toBe("idle");
    expect(controller.isBusy()).toBe(false);
  });

  it("ignores a pathname notification for the page it started on", () => {
    const { controller, env, curtains } = setup();
    controller.start("/about", { title: "About" });
    curtains[0].onCovered?.();
    controller.notifyPathname("/");
    expect(env.arrived).not.toHaveBeenCalled();
  });

  it("opens the curtain anyway if the route never arrives", () => {
    const { controller, curtains } = setup();
    controller.start("/slow", { title: "Slow" });
    curtains[0].onCovered?.();
    vi.advanceTimersByTime(ROUTE_WAIT_LIMIT_MS);
    expect(curtains).toHaveLength(2);
    expect(curtains[1].phase).toBe("reveal");
  });

  it("finishes even if the reveal animation never completes", () => {
    const { controller, root, curtains } = setup();
    controller.start("/about", { title: "About" });
    curtains[0].onCovered?.();
    controller.notifyPathname("/about");
    vi.advanceTimersByTime(700 + TITLE_HOLD_MS);
    vi.advanceTimersByTime(REVEAL_LIMIT_MS);
    expect(controller.isBusy()).toBe(false);
    expect(flag()).toBe("idle");
    expect(root.style.visibility).toBe("hidden");
    expect(root.style.pointerEvents).toBe("none");
  });

  it("can start another transition once the first has finished", () => {
    const { controller, curtains } = setup();
    controller.start("/about", { title: "About" });
    curtains[0].onCovered?.();
    controller.notifyPathname("/about");
    vi.advanceTimersByTime(700 + TITLE_HOLD_MS);
    curtains[1].timeline.complete();
    expect(controller.start("/contact", { title: "Contact" })).toBe("started");
  });
});

describe("Back, redirects, teardown", () => {
  it("aborts when the route changes by itself during the cover (Back, a redirect)", () => {
    const { controller, env, root, curtains } = setup();
    controller.start("/about", { title: "About" });
    controller.notifyPathname("/elsewhere");
    expect(controller.isBusy()).toBe(false);
    expect(flag()).toBe("idle");
    expect(root.style.visibility).toBe("hidden");
    expect(curtains[0].timeline.kill).toHaveBeenCalled();
    // the cancelled run must never push afterwards
    vi.advanceTimersByTime(COVER_PUSH_LIMIT_MS * 2);
    expect(env.push).not.toHaveBeenCalled();
  });

  it("abort() stops every timer and clears the flag", () => {
    const { controller, env, curtains } = setup();
    controller.start("/about", { title: "About" });
    curtains[0].onCovered?.();
    controller.abort();
    vi.advanceTimersByTime(ROUTE_WAIT_LIMIT_MS + REVEAL_LIMIT_MS);
    expect(curtains).toHaveLength(1);
    expect(flag()).toBe("idle");
    expect(controller.isBusy()).toBe(false);
    expect(env.push).toHaveBeenCalledTimes(1);
  });

  it("abort() with nothing running is harmless", () => {
    expect(() => setup().controller.abort()).not.toThrow();
  });

  it("replaces a stuck run when a link is clicked after the stale limit", () => {
    const { controller } = setup();
    void controller.cover("Stuck");
    expect(controller.start("/about", { title: "About" })).toBe("busy");
    vi.advanceTimersByTime(9_500);
    expect(controller.start("/about", { title: "About" })).toBe("started");
  });
});

describe("the manual cover and reveal", () => {
  it("cover() resolves when the page is hidden, reveal() when the curtain is gone", async () => {
    const { controller, curtains } = setup();
    let covered = false;
    const cover = controller.cover("Round trip").then(() => {
      covered = true;
    });
    expect(covered).toBe(false);
    curtains[0].onCovered?.();
    await cover;
    expect(covered).toBe(true);
    expect(flag()).toBe("covered");

    let revealed = false;
    const reveal = controller.reveal().then(() => {
      revealed = true;
    });
    expect(curtains[1].phase).toBe("reveal");
    curtains[1].timeline.complete();
    await reveal;
    expect(revealed).toBe(true);
    expect(controller.isBusy()).toBe(false);
  });

  it("cover() never navigates", () => {
    const { controller, env, curtains } = setup();
    void controller.cover("Title");
    curtains[0].onCovered?.();
    vi.advanceTimersByTime(COVER_PUSH_LIMIT_MS * 2);
    expect(env.push).not.toHaveBeenCalled();
  });

  it("reveal() with nothing running resolves at once", async () => {
    await expect(setup().controller.reveal()).resolves.toBeUndefined();
  });

  it("cover() resolves immediately when it cannot start", async () => {
    await expect(setup({ runtime: () => null }).controller.cover("Title")).resolves.toBeUndefined();
  });
});

describe("ending promptly on any navigation", () => {
  it("opens soon after a query-only navigation, without a pathname change", () => {
    const { controller, env, curtains } = setup();
    controller.start("/?tab=2", { title: "Home" });
    curtains[0].onCovered?.();
    // Next updates the URL (same path, new query) but usePathname() never changes.
    window.history.pushState({}, "", "/?tab=2");
    vi.advanceTimersByTime(LOCATION_POLL_MS);
    expect(env.arrived).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(700 + TITLE_HOLD_MS);
    expect(curtains[1].phase).toBe("reveal");
    expect(ROUTE_WAIT_LIMIT_MS).toBeGreaterThan(1000);
  });

  it("opens after a short grace when the push targets the very same location", () => {
    const { controller, env, curtains } = setup();
    controller.start("/", { title: "Home" });
    curtains[0].onCovered?.();
    vi.advanceTimersByTime(SAME_LOCATION_GRACE_MS);
    expect(env.arrived).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(700 + TITLE_HOLD_MS);
    expect(curtains[1].phase).toBe("reveal");
  });

  it("arrives once even when both the pathname and the location report the change", () => {
    const { controller, env, curtains } = setup();
    controller.start("/about", { title: "About" });
    curtains[0].onCovered?.();
    window.history.pushState({}, "", "/about");
    controller.notifyPathname("/about");
    vi.advanceTimersByTime(LOCATION_POLL_MS * 3);
    expect(env.arrived).toHaveBeenCalledTimes(1);
  });

  it("a manual cover opens soon after the route changes under it", () => {
    const { controller, env, curtains } = setup();
    void controller.cover("Manual");
    curtains[0].onCovered?.();
    controller.notifyPathname("/elsewhere");
    expect(env.arrived).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(700 + TITLE_HOLD_MS);
    expect(curtains[1].phase).toBe("reveal");
  });

  it("a manual cover that is never revealed opens by itself within the cap", () => {
    const { controller, curtains } = setup();
    void controller.cover("Forgotten");
    curtains[0].onCovered?.();
    vi.advanceTimersByTime(MANUAL_LIMIT_MS);
    expect(curtains[1].phase).toBe("reveal");
    expect(MANUAL_LIMIT_MS).toBeLessThanOrEqual(6000);
  });

  it("ignores a pathname notification for the starting page while covering", () => {
    const { controller } = setup();
    controller.start("/about", { title: "About" });
    controller.notifyPathname("/");
    expect(controller.isBusy()).toBe(true);
  });
});
