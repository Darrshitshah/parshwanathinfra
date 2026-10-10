import { describe, expect, it, vi } from "vitest";
import type { Lead } from "../schema";
import { deliverLead, formatEmail, isDeliveryConfigured, readDeliveryConfig } from "./delivery";

const lead: Lead = {
  name: "Asha Patel",
  phone: "9876543210",
  email: "asha@example.com",
  project: "shiv-shiva",
  interest: "2bhk-flat",
  budget: "20-30",
  visitDate: "2026-10-18",
  message: "Please call after 5 pm",
  plot: 42,
  source: "/projects/shiv-shiva",
};

function respond(status: number): typeof fetch {
  return vi.fn(async () => new Response("{}", { status })) as unknown as typeof fetch;
}

describe("readDeliveryConfig", () => {
  it("is empty when nothing is set", () => {
    expect(readDeliveryConfig({})).toEqual({});
    expect(isDeliveryConfigured(readDeliveryConfig({}))).toBe(false);
  });

  it("needs all three Resend settings", () => {
    expect(readDeliveryConfig({ RESEND_API_KEY: "key", ENQUIRY_TO_EMAIL: "team@example.com" }).resend).toBeUndefined();
    const config = readDeliveryConfig({
      RESEND_API_KEY: " key ",
      ENQUIRY_TO_EMAIL: "team@example.com, sales@example.com",
      ENQUIRY_FROM_EMAIL: "Website <web@example.com>",
    });
    expect(config.resend).toEqual({
      apiKey: "key",
      to: ["team@example.com", "sales@example.com"],
      from: "Website <web@example.com>",
    });
    expect(isDeliveryConfigured(config)).toBe(true);
  });

  it("accepts only an https webhook", () => {
    expect(readDeliveryConfig({ SHEETS_WEBHOOK_URL: "http://insecure.example.com/hook" }).sheetsWebhook).toBeUndefined();
    expect(readDeliveryConfig({ SHEETS_WEBHOOK_URL: "javascript:alert(1)" }).sheetsWebhook).toBeUndefined();
    const config = readDeliveryConfig({ SHEETS_WEBHOOK_URL: "https://script.example.com/exec" });
    expect(config.sheetsWebhook).toBe("https://script.example.com/exec");
    expect(isDeliveryConfigured(config)).toBe(true);
  });
});

describe("formatEmail", () => {
  it("lists every field and notes what was not given", () => {
    const { subject, text } = formatEmail({ ...lead, email: "", message: "", visitDate: "", plot: undefined, source: undefined }, "2026-10-10T08:00:00.000Z");
    expect(subject).toBe("Website enquiry: Asha Patel");
    expect(text).toContain("Mobile: +91 9876543210");
    expect(text).toContain("Email: not given");
    expect(text).toContain("Preferred visit: not given");
    expect(text).toContain("Message: none");
    expect(text).not.toContain("Plot:");
  });

  it("includes plot, unit and source when present", () => {
    const { text } = formatEmail({ ...lead, unit: "Block B3, floor 2" }, "2026-10-10T08:00:00.000Z");
    expect(text).toContain("Plot: 42");
    expect(text).toContain("Unit: Block B3, floor 2");
    expect(text).toContain("Sent from: /projects/shiv-shiva");
  });
});

describe("deliverLead", () => {
  it("sends the email through Resend with the bearer key and a reply-to", async () => {
    const fetchImpl = respond(200);
    const outcomes = await deliverLead(lead, { resend: { apiKey: "secret", to: ["team@example.com"], from: "web@example.com" } }, { fetchImpl });
    expect(outcomes).toEqual([{ provider: "resend", ok: true, status: 200 }]);
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer secret");
    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(["team@example.com"]);
    expect(body.reply_to).toBe("asha@example.com");
    expect(body.text).toContain("Asha Patel");
  });

  it("posts the lead to the Sheets webhook with a timestamp", async () => {
    const fetchImpl = respond(200);
    await deliverLead(lead, { sheetsWebhook: "https://script.example.com/exec" }, { fetchImpl, receivedAt: "2026-10-10T08:00:00.000Z" });
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://script.example.com/exec");
    expect(JSON.parse(init.body as string)).toMatchObject({ receivedAt: "2026-10-10T08:00:00.000Z", name: "Asha Patel", phone: "9876543210" });
  });

  it("reports each provider on its own and survives one failing", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("resend")) return new Response("{}", { status: 422 });
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    const outcomes = await deliverLead(
      lead,
      { resend: { apiKey: "k", to: ["a@example.com"], from: "b@example.com" }, sheetsWebhook: "https://script.example.com/exec" },
      { fetchImpl },
    );
    expect(outcomes).toEqual([
      { provider: "resend", ok: false, status: 422 },
      { provider: "sheets", ok: true, status: 200 },
    ]);
  });

  it("reports a provider that throws as failed, without the error text", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("connect ECONNREFUSED with Asha Patel 9876543210");
    }) as unknown as typeof fetch;
    const outcomes = await deliverLead(lead, { sheetsWebhook: "https://script.example.com/exec" }, { fetchImpl });
    expect(outcomes).toEqual([{ provider: "sheets", ok: false }]);
  });

  it("sends nothing when no provider is configured", async () => {
    const fetchImpl = respond(200);
    expect(await deliverLead(lead, {}, { fetchImpl })).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
