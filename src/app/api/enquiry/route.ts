/**
 * POST /api/enquiry. Owner: pages-lead. The logic lives in src/features/enquiry/server/handler.ts (zod validation,
 * honeypot, 3 s time trap, rate limit, Resend and/or Sheets delivery, honest 503 not-configured); this file only
 * exposes it. Secrets are read from the environment at request time (.env.example lists the names).
 */
import { handleEnquiry } from "@/features/enquiry/server/handler";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleEnquiry(request);
}
