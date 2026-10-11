import { describe, expect, it, vi } from "vitest";
import { createProgressStore } from "./progress-store";

describe("progress store", () => {
  it("clamps, notifies on change only, and unsubscribes", () => {
    const store = createProgressStore();
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.set(0.4);
    store.set(0.4);
    store.set(7);
    expect(store.get()).toBe(1);
    expect(listener.mock.calls.map((c) => c[0])).toEqual([0.4, 1]);
    off();
    store.set(0);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
