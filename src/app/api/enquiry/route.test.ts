import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_BODY_BYTES } from "@/features/enquiry/server/handler";
import { RATE_LIMIT_MAX, resetRateLimiters } from "@/features/enquiry/server/rate-limit";
import { POST } from "./route";

const ENV_KEYS = [
  "RESEND_API_KEY",
  "ENQUIRY_TO_EMAIL",
  "ENQUIRY_FROM_EMAIL",
  "SHEETS_WEBHOOK_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

const NAME = "Asha Patel";
const PHONE_DIGITS = "9876543210";
const EMAIL = "asha@example.com";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    name: NAME,
    phone: "+91 98765 43210",
    email: EMAIL,
    project: "shiv-shiva",
    interest: "2bhk-flat",
    budget: "20-30",
    visitDate: "",
    message: "Please call after 5 pm",
    consent: true,
    website: "",
    openedAt: Date.now() - 10_000,
    ...overrides,
  };
}

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/enquiry", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function configureSheets() {
  vi.stubEnv("SHEETS_WEBHOOK_URL", "https://script.example.com/exec");
}

function configureResend() {
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  vi.stubEnv("ENQUIRY_TO_EMAIL", "team@example.com");
  vi.stubEnv("ENQUIRY_FROM_EMAIL", "Website <web@example.com>");
}

function stubFetch(handler: (url: string) => Response | Promise<Response>) {
  const mock = vi.fn(async (input: string | URL | Request) => handler(String(input)));
  vi.stubGlobal("fetch", mock);
  return mock;
}

beforeEach(() => {
  for (const key of ENV_KEYS) vi.stubEnv(key, "");
  resetRateLimiters();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/enquiry: delivery", () => {
  it("answers 503 not-configured, honestly, when no provider is set up, and sends nothing", async () => {
    const fetchMock = stubFetch(() => new Response("{}"));
    const response = await POST(request(payload()));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, reason: "not-configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("delivers a valid enquiry to the Sheets webhook and answers 200", async () => {
    configureSheets();
    const fetchMock = stubFetch(() => new Response("ok", { status: 200 }));
    const response = await POST(request(payload({ plot: 42, source: "/projects/shiv-shiva" })));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://script.example.com/exec");
    const sent = JSON.parse(init.body as string);
    expect(sent).toMatchObject({ name: NAME, phone: PHONE_DIGITS, project: "shiv-shiva", interest: "2bhk-flat", plot: 42 });
    expect(sent).not.toHaveProperty("website");
    expect(sent).not.toHaveProperty("openedAt");
  });

  it("delivers through Resend when it is configured", async () => {
    configureResend();
    const fetchMock = stubFetch(() => new Response("{}", { status: 200 }));
    const response = await POST(request(payload()));
    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer re_test_key");
  });

  it("answers 200 when one of two providers fails, and 502 when every provider fails", async () => {
    configureResend();
    configureSheets();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    stubFetch((url) => (url.includes("resend") ? new Response("{}", { status: 500 }) : new Response("ok")));
    expect((await POST(request(payload()))).status).toBe(200);

    stubFetch(() => new Response("{}", { status: 500 }));
    const failed = await POST(request(payload()));
    expect(failed.status).toBe(502);
    expect(await failed.json()).toEqual({ ok: false, reason: "delivery-failed" });
  });

  it("never writes the lead's personal data to the logs", async () => {
    configureResend();
    configureSheets();
    const sinks = [
      vi.spyOn(console, "error").mockImplementation(() => undefined),
      vi.spyOn(console, "warn").mockImplementation(() => undefined),
      vi.spyOn(console, "log").mockImplementation(() => undefined),
      vi.spyOn(console, "info").mockImplementation(() => undefined),
    ];
    stubFetch(() => {
      throw new Error(`boom for ${NAME} ${PHONE_DIGITS} ${EMAIL}`);
    });
    await POST(request(payload()));
    stubFetch((url) => (url.includes("resend") ? new Response("{}", { status: 500 }) : new Response("ok")));
    await POST(request(payload()));

    const logged = JSON.stringify(sinks.flatMap((sink) => sink.mock.calls));
    expect(logged).toContain("[enquiry]");
    for (const secret of [NAME, PHONE_DIGITS, EMAIL, "Please call", "re_test_key"]) expect(logged).not.toContain(secret);
  });
});

describe("POST /api/enquiry: validation", () => {
  it("answers 400 with an error code for each bad field", async () => {
    configureSheets();
    const fetchMock = stubFetch(() => new Response("ok"));
    const response = await POST(request(payload({ name: "", phone: "12345", consent: false })));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      reason: "invalid",
      errors: { name: "nameRequired", phone: "phoneInvalid", consent: "consentRequired" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a project that does not exist", async () => {
    configureSheets();
    stubFetch(() => new Response("ok"));
    const response = await POST(request(payload({ project: "no-such-project" })));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, reason: "invalid", errors: { project: "projectInvalid" } });
  });

  it("rejects a past visit date", async () => {
    const response = await POST(request(payload({ visitDate: "2020-01-01" })));
    expect(response.status).toBe(400);
    expect((await response.json()).errors.visitDate).toBe("visitDatePast");
  });
});

describe("POST /api/enquiry: bot traps", () => {
  it("rejects a filled honeypot before validating anything, and delivers nothing", async () => {
    configureSheets();
    const fetchMock = stubFetch(() => new Response("ok"));
    const response = await POST(request(payload({ website: "http://spam.example", name: "" })));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, reason: "rejected" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a submit under 3 seconds after the form opened", async () => {
    configureSheets();
    const fetchMock = stubFetch(() => new Response("ok"));
    const response = await POST(request(payload({ openedAt: Date.now() - 1000 })));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, reason: "too-fast" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a submit at three seconds or more", async () => {
    configureSheets();
    stubFetch(() => new Response("ok"));
    expect((await POST(request(payload({ openedAt: Date.now() - 3500 })))).status).toBe(200);
  });

  it("rejects an open time that is far in the future", async () => {
    const response = await POST(request(payload({ openedAt: Date.now() + 60 * 60 * 1000 })));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, reason: "rejected" });
  });
});

describe("POST /api/enquiry: request guards", () => {
  it("answers 415 to a body that is not JSON", async () => {
    const response = await POST(request("name=Asha", { "content-type": "application/x-www-form-urlencoded" }));
    expect(response.status).toBe(415);
  });

  it("answers 400 to malformed JSON", async () => {
    const response = await POST(request("{not json"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, reason: "bad-request" });
  });

  it("answers 400 to a JSON body that is not an enquiry", async () => {
    const response = await POST(request(["a", "list"]));
    expect(response.status).toBe(400);
    expect((await response.json()).reason).toBe("invalid");
  });

  it("answers 413 to a body that is too large", async () => {
    const response = await POST(request(payload({ message: "x".repeat(MAX_BODY_BYTES) })));
    expect(response.status).toBe(413);
  });

  it("answers 403 to a browser post from another site, and allows the site itself", async () => {
    const foreign = await POST(request(payload(), { origin: "https://evil.example", "x-forwarded-host": "localhost" }));
    expect(foreign.status).toBe(403);
    const own = await POST(request(payload(), { origin: "http://localhost", "x-forwarded-host": "localhost" }));
    expect(own.status).toBe(503);
  });
});

describe("POST /api/enquiry: rate limit", () => {
  it("answers 429 with Retry-After once a client has used its allowance, per client", async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i += 1) {
      expect((await POST(request(payload()))).status).toBe(503);
    }
    const limited = await POST(request(payload()));
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ ok: false, reason: "rate-limited" });
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);

    // Another client is not affected.
    const other = await POST(request(payload(), { "x-forwarded-for": "198.51.100.20" }));
    expect(other.status).toBe(503);
  });
});
