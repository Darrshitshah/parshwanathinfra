// @vitest-environment jsdom
/**
 * The thin hooks: tier gating, loading the runtime on demand, cancelling on unmount, cleanup and restart.
 * The GSAP runtime is replaced by a fake whose `effects` just record how they were called.
 */
import { cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  device: { tier: "A", ready: true, reducedMotion: false, finePointer: true, touch: false, webgl2: true, saveData: false, smoothScroll: true } as Record<string, unknown>,
  loaded: null as unknown,
  resolvePending: null as null | ((runtime: unknown) => void),
}));

vi.mock("@/lib/device-tier-provider", () => ({ useDeviceTier: () => hoisted.device }));
vi.mock("./load", () => ({
  getMotion: () => hoisted.loaded,
  loadMotion: () =>
    new Promise((resolve) => {
      hoisted.resolvePending = resolve;
    }),
}));

import {
  useBoulevardWipe,
  useDimensionCount,
  useFadeReveal,
  useInkDraw,
  useMotionEffect,
  useMotionGate,
  useParallax,
  useSplitReveal,
  useStripBlinds,
} from "./hooks";

function fakeRuntime() {
  const stop = vi.fn();
  const effect = () => vi.fn<(...args: unknown[]) => () => void>(() => stop);
  const effects = {
    revealSplit: effect(),
    revealInk: effect(),
    revealDimension: effect(),
    revealBlinds: effect(),
    revealWipe: effect(),
    revealFade: effect(),
    driftParallax: effect(),
  };
  return { runtime: { effects }, effects, stop };
}

function setDevice(patch: Record<string, unknown>) {
  hoisted.device = { ...hoisted.device, ...patch };
}

beforeEach(() => {
  setDevice({ tier: "A", ready: true, reducedMotion: false });
  hoisted.loaded = null;
  hoisted.resolvePending = null;
});

afterEach(() => {
  cleanup();
});

function Probe(props: { enabled?: boolean; keyValue?: string; run: Parameters<typeof useMotionEffect>[3] }) {
  const ref = useRef<HTMLDivElement>(null);
  useMotionEffect(ref, props.enabled ?? true, props.keyValue ?? "a", props.run);
  return <div ref={ref} data-testid="el" />;
}

describe("useMotionGate", () => {
  function Gate({ onGate }: { onGate: (gate: ReturnType<typeof useMotionGate>) => void }) {
    onGate(useMotionGate());
    return null;
  }
  const gateFor = (patch: Record<string, unknown>) => {
    setDevice(patch);
    let result: ReturnType<typeof useMotionGate> | undefined;
    render(<Gate onGate={(gate) => (result = gate)} />);
    cleanup();
    return result as ReturnType<typeof useMotionGate>;
  };

  it("enables motion on tiers A and B once the tier is known, rich motion on A only", () => {
    expect(gateFor({ tier: "A" })).toMatchObject({ enabled: true, rich: true });
    expect(gateFor({ tier: "B" })).toMatchObject({ enabled: true, rich: false });
  });

  it("disables everything on Tier C, with reduced motion, and before the tier is known", () => {
    expect(gateFor({ tier: "C" })).toMatchObject({ enabled: false, rich: false });
    expect(gateFor({ tier: "A", reducedMotion: true })).toMatchObject({ enabled: false, rich: false });
    expect(gateFor({ tier: "A", reducedMotion: false, ready: false })).toMatchObject({ enabled: false, rich: false });
  });
});

describe("useMotionEffect", () => {
  it("runs at once, before paint, when the runtime has already loaded, and cleans up on unmount", () => {
    const { runtime } = fakeRuntime();
    hoisted.loaded = runtime;
    const stop = vi.fn();
    const run = vi.fn<(runtime: unknown, element: Element) => () => void>(() => stop);
    const view = render(<Probe run={run} />);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0]).toBe(runtime);
    expect(run.mock.calls[0][1]).toBe(view.getByTestId("el"));
    view.unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("waits for the runtime to load, then runs", async () => {
    const { runtime } = fakeRuntime();
    const run = vi.fn();
    render(<Probe run={run} />);
    expect(run).not.toHaveBeenCalled();
    hoisted.resolvePending?.(runtime);
    await Promise.resolve();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("never runs if it unmounts before the runtime arrives", async () => {
    const { runtime } = fakeRuntime();
    const run = vi.fn();
    const view = render(<Probe run={run} />);
    view.unmount();
    hoisted.resolvePending?.(runtime);
    await Promise.resolve();
    expect(run).not.toHaveBeenCalled();
  });

  it("does nothing while disabled, and starts when it becomes enabled", () => {
    const { runtime } = fakeRuntime();
    hoisted.loaded = runtime;
    const run = vi.fn();
    const view = render(<Probe enabled={false} run={run} />);
    expect(run).not.toHaveBeenCalled();
    view.rerender(<Probe enabled run={run} />);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("cleans up and restarts when the key changes, but not when only the closure changes", () => {
    const { runtime } = fakeRuntime();
    hoisted.loaded = runtime;
    const stop = vi.fn();
    const first = vi.fn(() => stop);
    const second = vi.fn(() => stop);
    const view = render(<Probe keyValue="a" run={first} />);
    expect(first).toHaveBeenCalledTimes(1);

    view.rerender(<Probe keyValue="a" run={second} />);
    expect(stop).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();

    view.rerender(<Probe keyValue="b" run={second} />);
    expect(stop).toHaveBeenCalledTimes(1);
    // the restart uses this render's closure, not the stale one
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(1);
  });

  it("tolerates a run that returns nothing", () => {
    hoisted.loaded = fakeRuntime().runtime;
    const view = render(<Probe run={() => undefined} />);
    expect(() => view.unmount()).not.toThrow();
  });
});

describe("the scroll hooks delegate to the runtime's effects", () => {
  function SplitHost(props: { by?: "lines" | "words" | "chars"; stagger?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    useSplitReveal(ref, props);
    return <div ref={ref} />;
  }

  function RevealHost() {
    const ref = useRef<HTMLDivElement>(null);
    useInkDraw(ref);
    useBoulevardWipe(ref, { direction: "rtl" });
    useFadeReveal(ref, { y: 10 });
    useDimensionCount(ref, 1565);
    return <div ref={ref} />;
  }

  function EverythingHost() {
    const ref = useRef<HTMLDivElement>(null);
    useSplitReveal(ref);
    useInkDraw(ref);
    useStripBlinds(ref);
    useBoulevardWipe(ref);
    useFadeReveal(ref);
    useDimensionCount(ref, 5);
    useParallax(ref);
    return <div ref={ref} />;
  }

  function BlindsHost({ strips }: { strips?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    useStripBlinds(ref, { strips });
    return <div ref={ref} />;
  }

  function ParallaxHost() {
    const ref = useRef<HTMLDivElement>(null);
    useParallax(ref, 12);
    return <div ref={ref} />;
  }

  it("useSplitReveal passes its options on", () => {
    const { runtime, effects } = fakeRuntime();
    hoisted.loaded = runtime;
    render(<SplitHost by="words" stagger={0.2} />);
    expect(effects.revealSplit).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ by: "words", stagger: 0.2 }));
  });

  it("useInkDraw, useBoulevardWipe, useFadeReveal and useDimensionCount run on Tier A and B", () => {
    for (const tier of ["A", "B"]) {
      cleanup();
      setDevice({ tier });
      const { runtime, effects } = fakeRuntime();
      hoisted.loaded = runtime;
      render(<RevealHost />);
      expect(effects.revealInk).toHaveBeenCalledTimes(1);
      expect(effects.revealWipe).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ direction: "rtl" }));
      expect(effects.revealFade).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ y: 10 }));
      expect(effects.revealDimension).toHaveBeenCalledWith(expect.any(HTMLElement), 1565, expect.any(Object));
    }
  });

  it("none of them run on Tier C or with reduced motion", () => {
    for (const patch of [{ tier: "C" }, { reducedMotion: true }]) {
      cleanup();
      setDevice({ tier: "A", reducedMotion: false });
      setDevice(patch);
      const { runtime, effects } = fakeRuntime();
      hoisted.loaded = runtime;
      render(<EverythingHost />);
      for (const effect of Object.values(effects)) expect(effect).not.toHaveBeenCalled();
    }
  });

  it("useStripBlinds uses 12 strips on Tier A and 6 on Tier B unless told otherwise", () => {
    const strips = (tier: string, option?: number) => {
      cleanup();
      setDevice({ tier });
      const { runtime, effects } = fakeRuntime();
      hoisted.loaded = runtime;
      render(<BlindsHost strips={option} />);
      return effects.revealBlinds.mock.calls[0]?.[1];
    };
    expect(strips("A")).toBe(12);
    expect(strips("B")).toBe(6);
    expect(strips("B", 9)).toBe(9);
  });

  it("useParallax runs on Tier A only", () => {
    const calls = (tier: string) => {
      cleanup();
      setDevice({ tier });
      const { runtime, effects } = fakeRuntime();
      hoisted.loaded = runtime;
      render(<ParallaxHost />);
      return effects.driftParallax.mock.calls.length;
    };
    expect(calls("A")).toBe(1);
    expect(calls("B")).toBe(0);
  });
});
