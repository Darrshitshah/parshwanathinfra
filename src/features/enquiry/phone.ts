/**
 * Indian mobile number handling. Pure and dependency free, so the client form, the schema and the route handler
 * all use the same rules. Owner: pages-lead.
 *
 * Accepted shapes (spaces, dashes, dots and brackets are ignored): 9876543210, 09876543210, +919876543210,
 * 919876543210 (twelve digits) and 00919876543210. The result is the bare ten digits, which must match
 * ^[6-9]\d{9}$ (BUILD_SPEC section 9).
 */

export const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

const EN_DASH = String.fromCharCode(0x2013);
const EM_DASH = String.fromCharCode(0x2014);
const NON_BREAKING_SPACE = String.fromCharCode(0x00a0);
// Whitespace, ASCII and typographic dashes, dots and brackets that people type between digits.
const SEPARATORS = new RegExp(`[\\s\\-.()${EN_DASH}${EM_DASH}${NON_BREAKING_SPACE}]`, "g");

/** Returns the ten-digit mobile number, or null when the input is not a valid Indian mobile number. */
export function normalizePhone(raw: string): string | null {
  const compact = raw.replace(SEPARATORS, "");
  let digits: string;
  if (compact.startsWith("+")) {
    if (!compact.startsWith("+91")) return null;
    digits = compact.slice(3);
  } else if (compact.startsWith("0091")) {
    digits = compact.slice(4);
  } else if (compact.length === 12 && compact.startsWith("91")) {
    digits = compact.slice(2);
  } else if (compact.length === 11 && compact.startsWith("0")) {
    digits = compact.slice(1);
  } else {
    digits = compact;
  }
  return INDIAN_MOBILE_PATTERN.test(digits) ? digits : null;
}

/** "9876543210" becomes "+91 98765 43210". Returns the input unchanged when it is not ten digits. */
export function formatPhone(tenDigits: string): string {
  if (!/^\d{10}$/.test(tenDigits)) return tenDigits;
  return `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`;
}
