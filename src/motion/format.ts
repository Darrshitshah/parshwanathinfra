/**
 * Number formatting for the counters. Owner: motion-lead.
 *
 * The site speaks to Indian buyers, so grouping follows the Indian system: 1,565 and 12,50,000.
 */
import { clamp } from "./math";

const LOCALE = "en-IN";
const formatters = new Map<number, Intl.NumberFormat>();

function formatterFor(decimals: number): Intl.NumberFormat {
  const key = Math.max(0, Math.min(6, Math.round(decimals)));
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: key, maximumFractionDigits: key });
    formatters.set(key, formatter);
  }
  return formatter;
}

/** A reusable formatter for `dimensionCount`: `createNumberFormatter(0)(1565)` is "1,565". */
export function createNumberFormatter(decimals = 0): (value: number) => string {
  const formatter = formatterFor(decimals);
  return (value) => formatter.format(value);
}

/** One-off helper: `formatIndian(1250000)` is "12,50,000". */
export function formatIndian(value: number, decimals = 0): string {
  return formatterFor(decimals).format(value);
}

/** The loader counter: always three characters so the number never changes width (042%, 100%). */
export function formatCounter(percent: number): string {
  const whole = Math.round(clamp(Number.isFinite(percent) ? percent : 0, 0, 100));
  return String(whole).padStart(3, "0");
}
