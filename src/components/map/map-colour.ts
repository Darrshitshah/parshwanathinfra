/**
 * Colour maths for the map style: MapLibre takes plain colour strings, not `color-mix()`, so the palette is mixed
 * here from the site's tokens (read at runtime, see map-runtime.ts). Pure functions. Owner: pages-lead.
 */

export type Rgb = readonly [number, number, number];

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i;

/** "#abc", "#aabbcc" or "rgb(r g b)" / "rgb(r, g, b, a)" to [r, g, b]; null when it cannot be read. */
export function parseColour(value: string): Rgb | null {
  const text = value.trim();
  const hex = HEX.exec(text);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((digit) => digit + digit).join("") : hex[1];
    return [0, 2, 4].map((start) => parseInt(digits.slice(start, start + 2), 16)) as unknown as Rgb;
  }
  const rgb = RGB.exec(text);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])].map((channel) => clampChannel(channel)) as unknown as Rgb;
  return null;
}

function clampChannel(channel: number): number {
  return Math.min(255, Math.max(0, Math.round(channel)));
}

export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((channel) => clampChannel(channel).toString(16).padStart(2, "0")).join("")}`;
}

/** `amount` of `b` mixed into `a` in sRGB (0 = a, 1 = b), like CSS `color-mix(in srgb, a, b amount)`. */
export function mix(a: string, b: string, amount: number): string {
  const from = parseColour(a);
  const to = parseColour(b);
  if (!from || !to) return a;
  const t = Math.min(1, Math.max(0, amount));
  return toHex([0, 1, 2].map((index) => from[index] + (to[index] - from[index]) * t) as unknown as Rgb);
}

/** `rgba()` string for a colour at an opacity (MapLibre reads rgba). */
export function withAlpha(colour: string, alpha: number): string {
  const rgb = parseColour(colour);
  if (!rgb) return colour;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Math.min(1, Math.max(0, alpha))})`;
}

/** Relative luminance (WCAG), 0 for black to 1 for white. */
export function luminance(colour: string): number {
  const rgb = parseColour(colour);
  if (!rgb) return 1;
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
