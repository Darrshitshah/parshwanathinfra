/** A tiny external store for scroll progress (0..1). The render loops read it without re-rendering React. */
export interface ProgressStore {
  get(): number;
  set(value: number): void;
  subscribe(listener: (value: number) => void): () => void;
}

export function createProgressStore(initial = 0): ProgressStore {
  let value = initial;
  const listeners = new Set<(v: number) => void>();
  return {
    get: () => value,
    set(next) {
      const clamped = Math.min(1, Math.max(0, next));
      if (clamped === value) return;
      value = clamped;
      listeners.forEach((listener) => listener(clamped));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
