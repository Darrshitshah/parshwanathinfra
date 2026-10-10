import { describe, expect, it, vi } from "vitest";
import { submitEnquiry, ENQUIRY_ENDPOINT } from "./submit";
import type { EnquiryInput } from "./schema";

const payload: EnquiryInput = {
  name: "Asha Patel",
  phone: "9876543210",
  project: "shiv-shiva",
  interest: "shop",
  budget: "not-sure",
  consent: true,
  openedAt: 1,
};

function reply(status: number, body: unknown): typeof fetch {
  return vi.fn(async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status })) as unknown as typeof fetch;
}

describe("submitEnquiry", () => {
  it("posts JSON to the enquiry endpoint", async () => {
    const fetchImpl = reply(200, { ok: true });
    await submitEnquiry(payload, { fetchImpl });
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(ENQUIRY_ENDPOINT);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["content-type"]).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it("reports success only when the server says ok", async () => {
    expect(await submitEnquiry(payload, { fetchImpl: reply(200, { ok: true }) })).toEqual({ kind: "success" });
    expect(await submitEnquiry(payload, { fetchImpl: reply(200, { ok: false }) })).toEqual({ kind: "error" });
    expect(await submitEnquiry(payload, { fetchImpl: reply(200, "not json") })).toEqual({ kind: "error" });
  });

  it("maps the not-configured 503 honestly", async () => {
    const result = await submitEnquiry(payload, { fetchImpl: reply(503, { ok: false, reason: "not-configured" }) });
    expect(result).toEqual({ kind: "not-configured" });
  });

  it("treats other 5xx answers as a generic error", async () => {
    expect(await submitEnquiry(payload, { fetchImpl: reply(502, { ok: false, reason: "delivery-failed" }) })).toEqual({ kind: "error" });
    expect(await submitEnquiry(payload, { fetchImpl: reply(500, "") })).toEqual({ kind: "error" });
  });

  it("maps validation errors, keeping only known codes", async () => {
    const result = await submitEnquiry(payload, {
      fetchImpl: reply(400, { ok: false, reason: "invalid", errors: { phone: "phoneInvalid", name: "made-up-code" } }),
    });
    expect(result).toEqual({ kind: "invalid", errors: { phone: "phoneInvalid", name: "generic" } });
  });

  it("maps the time trap, the honeypot and the rate limit", async () => {
    expect(await submitEnquiry(payload, { fetchImpl: reply(400, { ok: false, reason: "too-fast" }) })).toEqual({ kind: "too-fast" });
    expect(await submitEnquiry(payload, { fetchImpl: reply(400, { ok: false, reason: "rejected" }) })).toEqual({ kind: "rejected" });
    expect(await submitEnquiry(payload, { fetchImpl: reply(429, { ok: false, reason: "rate-limited" }) })).toEqual({ kind: "rate-limited" });
  });

  it("reports a network failure when fetch throws", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("offline");
    }) as unknown as typeof fetch;
    expect(await submitEnquiry(payload, { fetchImpl })).toEqual({ kind: "network" });
  });

  it("gives up after the timeout", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    ) as unknown as typeof fetch;
    expect(await submitEnquiry(payload, { fetchImpl, timeoutMs: 10 })).toEqual({ kind: "network" });
  });
});
