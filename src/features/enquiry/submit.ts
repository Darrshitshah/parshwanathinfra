/**
 * Client side of the enquiry POST. Maps every way the request can end onto a small result type the form can show
 * honestly: it never reports success unless the server said so. Owner: pages-lead.
 */
import { isErrorCode, type EnquiryFieldErrors, type EnquiryInput } from "./schema";

export const ENQUIRY_ENDPOINT = "/api/enquiry";
const REQUEST_TIMEOUT_MS = 15_000;

export type SubmitResult =
  | { kind: "success" }
  /** The server has no delivery provider configured yet (503 not-configured). Nothing was sent. */
  | { kind: "not-configured" }
  | { kind: "invalid"; errors: EnquiryFieldErrors }
  | { kind: "rate-limited" }
  | { kind: "too-fast" }
  | { kind: "rejected" }
  /** The server answered with something unexpected (5xx, bad body). Nothing is known to have been sent. */
  | { kind: "error" }
  /** No answer at all: offline, DNS, timeout. */
  | { kind: "network" };

interface SubmitOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJson(response: Response): Promise<Record<string, unknown> | undefined> {
  try {
    const body: unknown = await response.json();
    return isRecord(body) ? body : undefined;
  } catch {
    return undefined;
  }
}

function readErrors(value: unknown): EnquiryFieldErrors {
  if (!isRecord(value)) return {};
  const errors: Record<string, string> = {};
  for (const [field, code] of Object.entries(value)) {
    errors[field] = isErrorCode(code) ? code : "generic";
  }
  return errors as EnquiryFieldErrors;
}

async function mapResponse(response: Response): Promise<SubmitResult> {
  const body = await readJson(response);
  const reason = typeof body?.reason === "string" ? body.reason : undefined;

  if (response.ok && body?.ok === true) return { kind: "success" };
  if (response.status === 503 && reason === "not-configured") return { kind: "not-configured" };
  if (response.status === 429) return { kind: "rate-limited" };
  if (response.status === 400 || response.status === 422) {
    if (reason === "too-fast") return { kind: "too-fast" };
    if (reason === "rejected") return { kind: "rejected" };
    if (reason === "invalid") return { kind: "invalid", errors: readErrors(body?.errors) };
  }
  return { kind: "error" };
}

export async function submitEnquiry(payload: EnquiryInput, options: SubmitOptions = {}): Promise<SubmitResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(ENQUIRY_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return await mapResponse(response);
  } catch {
    return { kind: "network" };
  } finally {
    clearTimeout(timer);
  }
}
