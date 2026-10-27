// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useNear } from "./use-near";

function Probe({ margin }: { margin?: string }) {
  const [ref, near] = useNear<HTMLDivElement>(margin);
  return <div ref={ref}>{near ? "near" : "far"}</div>;
}

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("useNear", () => {
  it("turns true once the element comes within the margin, then stops observing", () => {
    let fire: Callback = () => undefined;
    const options: Array<IntersectionObserverInit | undefined> = [];
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: Callback, init?: IntersectionObserverInit) {
          fire = callback;
          options.push(init);
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    render(<Probe margin="300px 0px" />);
    expect(screen.getByText("far")).toBeTruthy();
    expect(options[0]?.rootMargin).toBe("300px 0px");

    act(() => fire([{ isIntersecting: false }]));
    expect(screen.getByText("far")).toBeTruthy();
    act(() => fire([{ isIntersecting: true }]));
    expect(screen.getByText("near")).toBeTruthy();
    expect(disconnect).toHaveBeenCalled();
  });

  it("turns true soon after mount without IntersectionObserver", () => {
    vi.useFakeTimers();
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Probe />);
    expect(screen.getByText("far")).toBeTruthy();
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.getByText("near")).toBeTruthy();
  });
});
