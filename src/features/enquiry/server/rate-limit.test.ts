import { afterEach, describe, expect, it, vi } from "vitest";
import { clientKey, createMemoryLimiter, getRateLimiter, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS, resetRateLimiters } from "./rate-limit";

afterEach(() => {
  resetRateLimiters();
  vi.restoreAllMocks();
});

describe("createMemoryLimiter", () => {
  it("allows up to the limit, then blocks with a retry time", async () => {
    let now = 1_000_000;
    const limiter = createMemoryLimiter({ limit: 3, windowMs: 60_000, now: () => now });
    for (let i = 0; i < 3; i += 1) {
      expect((await limiter.check("a")).allowed).toBe(true);
      now += 1000;
    }
    const blocked = await limiter.check("a");
    expect(blocked.allowed).toBe(false);
    // The oldest hit was 3 s ago in a 60 s window.
    expect(blocked.retryAfterSeconds).toBe(57);
  });

  it("counts each client separately", async () => {
    const limiter = createMemoryLimiter({ limit: 1, windowMs: 60_000, now: () => 5 });
    expect((await limiter.check("a")).allowed).toBe(true);
    expect((await limiter.check("a")).allowed).toBe(false);
    expect((await limiter.check("b")).allowed).toBe(true);
  });

  it("lets a client back in once the window has passed", async () => {
    let now = 0;
    const limiter = createMemoryLimiter({ limit: 1, windowMs: 1000, now: () => now });
    expect((await limiter.check("a")).allowed).toBe(true);
    expect((await limiter.check("a")).allowed).toBe(false);
    now = 1001;
    expect((await limiter.check("a")).allowed).toBe(true);
  });

  it("uses a sensible default of 8 enquiries in 10 minutes", async () => {
    const limiter = createMemoryLimiter();
    expect(RATE_LIMIT_MAX).toBe(8);
    expect(RATE_LIMIT_WINDOW_MS).toBe(600_000);
    for (let i = 0; i < RATE_LIMIT_MAX; i += 1) expect((await limiter.check("x")).allowed).toBe(true);
    expect((await limiter.check("x")).allowed).toBe(false);
  });
});

describe("getRateLimiter", () => {
  it("uses the in-memory limiter when Upstash is not configured, and keeps one instance", async () => {
    const first = getRateLimiter({});
    const second = getRateLimiter({});
    expect((await first.check("k")).allowed).toBe(true);
    // Same underlying counters: the second call sees the first call's hit.
    for (let i = 0; i < RATE_LIMIT_MAX - 1; i += 1) await second.check("k");
    expect((await first.check("k")).allowed).toBe(false);
  });

  it("falls back to the in-memory limiter when Upstash fails", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.doMock("@upstash/ratelimit", () => {
      throw new Error("offline");
    });
    const limiter = getRateLimiter({ UPSTASH_REDIS_REST_URL: "https://example.upstash.io", UPSTASH_REDIS_REST_TOKEN: "token" });
    const result = await limiter.check("k");
    expect(result.allowed).toBe(true);
    expect(errors).toHaveBeenCalled();
    // The log line carries no client key and no address.
    expect(JSON.stringify(errors.mock.calls)).not.toContain("example.upstash.io");
    vi.doUnmock("@upstash/ratelimit");
  });
});

describe("clientKey", () => {
  it("hashes the first forwarded address and never returns it", () => {
    const key = clientKey(new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }));
    expect(key).toMatch(/^[0-9a-f]{24}$/);
    expect(key).not.toContain("203");
  });

  it("is stable for the same address and different for another", () => {
    const a = clientKey(new Headers({ "x-forwarded-for": "203.0.113.9" }));
    const b = clientKey(new Headers({ "x-real-ip": "203.0.113.9" }));
    const c = clientKey(new Headers({ "x-forwarded-for": "203.0.113.10" }));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("still returns a key when no address header exists", () => {
    expect(clientKey(new Headers())).toMatch(/^[0-9a-f]{24}$/);
  });
});
