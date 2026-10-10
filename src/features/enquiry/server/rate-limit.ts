/**
 * Rate limiting for the enquiry route (BUILD_SPEC section 9): Upstash Redis when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set, otherwise a best-effort in-memory sliding window (per server instance, so it only
 * slows a single abusive client; it is not a guarantee on a multi-instance host). Keys are hashed client ids, never raw
 * IP addresses. Server only. Owner: pages-lead.
 */
import { createHash } from "node:crypto";

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until another attempt is accepted (at least 1 when not allowed). */
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
}

/** 8 enquiries per client in 10 minutes: room for a few corrections, no room for a script. */
export const RATE_LIMIT_MAX = 8;
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_TRACKED_KEYS = 5000;

interface MemoryLimiterOptions {
  limit?: number;
  windowMs?: number;
  now?: () => number;
}

export function createMemoryLimiter({
  limit = RATE_LIMIT_MAX,
  windowMs = RATE_LIMIT_WINDOW_MS,
  now = Date.now,
}: MemoryLimiterOptions = {}): RateLimiter {
  const hits = new Map<string, number[]>();

  function prune(current: number) {
    for (const [key, times] of hits) {
      const fresh = times.filter((time) => current - time < windowMs);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  }

  return {
    async check(key) {
      const current = now();
      if (hits.size >= MAX_TRACKED_KEYS) prune(current);
      const recent = (hits.get(key) ?? []).filter((time) => current - time < windowMs);
      if (recent.length >= limit) {
        const oldest = recent[0] ?? current;
        hits.set(key, recent);
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - current) / 1000)) };
      }
      recent.push(current);
      hits.set(key, recent);
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

interface UpstashEnv {
  url: string;
  token: string;
}

async function createUpstashLimiter({ url, token }: UpstashEnv): Promise<RateLimiter> {
  const [{ Ratelimit }, { Redis }] = await Promise.all([import("@upstash/ratelimit"), import("@upstash/redis")]);
  const ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, "10 m"),
    prefix: "pi:enquiry",
    analytics: false,
  });
  return {
    async check(key) {
      const result = await ratelimit.limit(key);
      const retryAfterSeconds = result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      return { allowed: result.success, retryAfterSeconds };
    },
  };
}

let memoryLimiter: RateLimiter | undefined;
let upstashLimiter: Promise<RateLimiter> | undefined;
let upstashKey = "";

/** Test helper: forget every counter. */
export function resetRateLimiters(): void {
  memoryLimiter = undefined;
  upstashLimiter = undefined;
  upstashKey = "";
}

/**
 * The limiter for this environment. If Upstash is configured but fails (network, quota), the request falls back to
 * the in-memory limiter: a rate-limit outage must never stop a real enquiry.
 */
export function getRateLimiter(env: Record<string, string | undefined> = process.env): RateLimiter {
  memoryLimiter ??= createMemoryLimiter();
  const fallback = memoryLimiter;
  const url = env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return fallback;

  const key = `${url}|${token}`;
  if (key !== upstashKey) {
    upstashKey = key;
    upstashLimiter = createUpstashLimiter({ url, token });
  }
  const pending = upstashLimiter;
  return {
    async check(clientKey) {
      try {
        const limiter = await pending;
        return await limiter?.check(clientKey) ?? (await fallback.check(clientKey));
      } catch {
        console.error("[enquiry] rate limiter unavailable, using the in-memory limiter");
        return fallback.check(clientKey);
      }
    },
  };
}

/** A stable, anonymous key for a client: SHA-256 of the forwarded address, shortened. The raw address is never stored. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || headers.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(address).digest("hex").slice(0, 24);
}
