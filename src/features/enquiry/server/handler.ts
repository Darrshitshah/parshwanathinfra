/**
 * The enquiry POST, as BUILD_SPEC section 9 describes it. Owner: pages-lead.
 *
 * Order of the gates (cheap and non-committal first):
 *   same-origin, JSON content type, size, JSON parse, rate limit, honeypot, zod validation, time trap, known project,
 *   delivery configured, delivery. Every outcome is an honest status the form can show:
 *     200 { ok: true }                                   delivered by at least one provider
 *     400 { ok: false, reason: "invalid", errors }       validation (field to error code)
 *     400 { ok: false, reason: "too-fast" | "rejected" | "bad-request" }
 *     403 { ok: false, reason: "forbidden-origin" }
 *     413 { ok: false, reason: "too-large" }   415 { ok: false, reason: "unsupported-media-type" }
 *     429 { ok: false, reason: "rate-limited" }          with Retry-After
 *     502 { ok: false, reason: "delivery-failed" }       every configured provider failed
 *     503 { ok: false, reason: "not-configured" }        no delivery provider is set up: nothing was sent
 * It never claims a lead was sent when it was not, and never logs the lead's personal data.
 */
import { getProject } from "@/content/projects";
import { checkTimeTrap, toLead, validateEnquiry } from "../schema";
import { deliverLead, isDeliveryConfigured, readDeliveryConfig, type DeliveryConfig, type DeliveryOutcome } from "./delivery";
import { clientKey, getRateLimiter, type RateLimiter } from "./rate-limit";

/** An enquiry is a few hundred bytes; anything near this is not one. */
export const MAX_BODY_BYTES = 16 * 1024;

export interface HandlerDeps {
  now: () => number;
  limiter: RateLimiter;
  config: DeliveryConfig;
  fetchImpl: typeof fetch;
}

function defaultDeps(): HandlerDeps {
  return {
    now: Date.now,
    limiter: getRateLimiter(),
    config: readDeliveryConfig(),
    fetchImpl: fetch,
  };
}

function reply(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A browser POST from another site carries a different Origin. No Origin (curl, server to server) is allowed. */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function readBody(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return { ok: false, response: reply(413, { ok: false, reason: "too-large" }) };
  }
  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, response: reply(400, { ok: false, reason: "bad-request" }) };
  }
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return { ok: false, response: reply(413, { ok: false, reason: "too-large" }) };
  }
  try {
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: reply(400, { ok: false, reason: "bad-request" }) };
  }
}

function summarise(outcomes: readonly DeliveryOutcome[]): string {
  return outcomes.map((outcome) => `${outcome.provider}:${outcome.ok ? "ok" : (outcome.status ?? "error")}`).join(" ");
}

export async function handleEnquiry(request: Request, overrides: Partial<HandlerDeps> = {}): Promise<Response> {
  const deps: HandlerDeps = { ...defaultDeps(), ...overrides };

  if (!isSameOrigin(request)) return reply(403, { ok: false, reason: "forbidden-origin" });
  if (!(request.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
    return reply(415, { ok: false, reason: "unsupported-media-type" });
  }

  const parsed = await readBody(request);
  if (!parsed.ok) return parsed.response;

  const limit = await deps.limiter.check(clientKey(request.headers));
  if (!limit.allowed) {
    return reply(429, { ok: false, reason: "rate-limited" }, { "retry-after": String(limit.retryAfterSeconds) });
  }

  // Honeypot: people never see this field. Rejected before validation, so a bot learns nothing about the real rules.
  if (isRecord(parsed.body) && typeof parsed.body.website === "string" && parsed.body.website.trim() !== "") {
    return reply(400, { ok: false, reason: "rejected" });
  }

  const checked = validateEnquiry(parsed.body);
  if (!checked.ok) return reply(400, { ok: false, reason: "invalid", errors: checked.errors });
  const data = checked.data;

  const trap = checkTimeTrap(data.openedAt, deps.now());
  if (trap === "too-fast") return reply(400, { ok: false, reason: "too-fast" });
  if (trap === "implausible") return reply(400, { ok: false, reason: "rejected" });

  if (!getProject(data.project)) {
    return reply(400, { ok: false, reason: "invalid", errors: { project: "projectInvalid" } });
  }

  // Nothing is delivered without a provider: say so instead of pretending.
  if (!isDeliveryConfigured(deps.config)) return reply(503, { ok: false, reason: "not-configured" });

  const outcomes = await deliverLead(toLead(data), deps.config, { fetchImpl: deps.fetchImpl });
  if (outcomes.some((outcome) => outcome.ok)) {
    const failed = outcomes.filter((outcome) => !outcome.ok);
    // The lead did arrive somewhere. Log a partial failure so the team can fix the other provider.
    if (failed.length > 0) console.error(`[enquiry] partial delivery failure: ${summarise(failed)}`);
    return reply(200, { ok: true });
  }

  console.error(`[enquiry] delivery failed: ${summarise(outcomes)}`);
  return reply(502, { ok: false, reason: "delivery-failed" });
}
