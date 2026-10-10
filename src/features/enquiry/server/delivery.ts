/**
 * Delivers an enquiry to the Parshwanath Infra team: an email through Resend and/or a row through a Google Sheets
 * webhook (BUILD_SPEC section 9). Both are optional; with neither configured the route answers 503 not-configured and
 * the form says so honestly. Failures are logged with the provider and the status only, never the lead's data.
 * Server only. Owner: pages-lead.
 */
import type { Lead } from "../schema";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const REQUEST_TIMEOUT_MS = 8000;

export interface ResendConfig {
  apiKey: string;
  to: string[];
  from: string;
}

export interface DeliveryConfig {
  resend?: ResendConfig;
  sheetsWebhook?: string;
}

export type Provider = "resend" | "sheets";

export interface DeliveryOutcome {
  provider: Provider;
  ok: boolean;
  status?: number;
}

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

/** Read the delivery settings from the environment, at request time. A provider needs all of its settings. */
export function readDeliveryConfig(env: Record<string, string | undefined> = process.env): DeliveryConfig {
  const config: DeliveryConfig = {};
  const apiKey = clean(env.RESEND_API_KEY);
  const to = clean(env.ENQUIRY_TO_EMAIL)
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  const from = clean(env.ENQUIRY_FROM_EMAIL);
  if (apiKey && to.length > 0 && from) config.resend = { apiKey, to, from };

  const webhook = clean(env.SHEETS_WEBHOOK_URL);
  if (/^https:\/\//i.test(webhook)) config.sheetsWebhook = webhook;
  return config;
}

export function isDeliveryConfigured(config: DeliveryConfig): boolean {
  return Boolean(config.resend ?? config.sheetsWebhook);
}

/** The plain-text email body: one labelled line per field. */
export function formatEmail(lead: Lead, receivedAt: string): { subject: string; text: string } {
  const lines = [
    ["Name", lead.name],
    ["Mobile", `+91 ${lead.phone}`],
    ["Email", lead.email || "not given"],
    ["Project", lead.project],
    ["Looking for", lead.interest],
    ["Budget", lead.budget],
    ["Preferred visit", lead.visitDate || "not given"],
    ["Message", lead.message || "none"],
    ...(lead.plot === undefined ? [] : [["Plot", String(lead.plot)]]),
    ...(lead.unit ? [["Unit", lead.unit]] : []),
    ...(lead.source ? [["Sent from", lead.source]] : []),
    ["Received", receivedAt],
  ];
  return {
    subject: `Website enquiry: ${lead.name}`,
    text: lines.map(([label, value]) => `${label}: ${value}`).join("\n"),
  };
}

async function post(url: string, init: RequestInit, fetchImpl: typeof fetch): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sendResend(config: ResendConfig, lead: Lead, receivedAt: string, fetchImpl: typeof fetch): Promise<DeliveryOutcome> {
  const { subject, text } = formatEmail(lead, receivedAt);
  const response = await post(
    RESEND_ENDPOINT,
    {
      method: "POST",
      headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: config.from,
        to: config.to,
        subject,
        text,
        ...(lead.email ? { reply_to: lead.email } : {}),
      }),
    },
    fetchImpl,
  );
  return { provider: "resend", ok: response.ok, status: response.status };
}

async function sendSheets(url: string, lead: Lead, receivedAt: string, fetchImpl: typeof fetch): Promise<DeliveryOutcome> {
  const response = await post(
    url,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ receivedAt, ...lead }),
    },
    fetchImpl,
  );
  return { provider: "sheets", ok: response.ok, status: response.status };
}

/**
 * Send the lead to every configured provider. Resolves with one outcome per provider; a provider that throws is
 * reported as failed (without the error text, which can echo request data).
 */
export async function deliverLead(
  lead: Lead,
  config: DeliveryConfig,
  options: { fetchImpl?: typeof fetch; receivedAt?: string } = {},
): Promise<DeliveryOutcome[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const receivedAt = options.receivedAt ?? new Date().toISOString();
  const jobs: Array<{ provider: Provider; run: Promise<DeliveryOutcome> }> = [];
  if (config.resend) jobs.push({ provider: "resend", run: sendResend(config.resend, lead, receivedAt, fetchImpl) });
  if (config.sheetsWebhook) jobs.push({ provider: "sheets", run: sendSheets(config.sheetsWebhook, lead, receivedAt, fetchImpl) });

  const settled = await Promise.allSettled(jobs.map((job) => job.run));
  return settled.map((result, index): DeliveryOutcome => {
    const provider = jobs[index]?.provider ?? "sheets";
    return result.status === "fulfilled" ? result.value : { provider, ok: false };
  });
}
