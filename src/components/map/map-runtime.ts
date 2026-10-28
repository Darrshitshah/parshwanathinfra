/**
 * Browser helpers for the live map, imported only by the lazy map canvas: read the site's colour tokens for the
 * current theme (read on <body>, so the map looks the same on every colour block), and watch for the theme toggling. Owner: pages-lead.
 */
import type { MapTokens } from "./map-style";
import { parseColour, toHex } from "./map-colour";

const TOKEN_VARS: Record<keyof MapTokens, string> = {
  paper: "--paper",
  paperRaised: "--paper-raised",
  paperSunk: "--paper-sunk",
  ink: "--ink",
  inkMuted: "--ink-muted",
  sand: "--sand",
  brick: "--brick",
  brickInk: "--brick-ink",
  forest: "--forest",
  water: "--type-flats",
};

/**
 * Resolves each token to a hex colour. Tokens can be `color-mix()` or `var()` chains (colour blocks re-point them), so a
 * probe element takes each as its colour and a 1 px canvas reads back the pixel the browser actually computed.
 */
export function readMapTokens(host: HTMLElement = document.body): MapTokens | null {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden";
  host.append(probe);
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  try {
    const entries = (Object.keys(TOKEN_VARS) as Array<keyof MapTokens>).map((key) => {
      probe.style.color = `var(${TOKEN_VARS[key]})`;
      return [key, resolveColour(getComputedStyle(probe).color, context)] as const;
    });
    if (entries.some(([, value]) => value === null)) return null;
    return Object.fromEntries(entries) as unknown as MapTokens;
  } finally {
    probe.remove();
  }
}

function resolveColour(computed: string, context: CanvasRenderingContext2D | null): string | null {
  const direct = parseColour(computed);
  if (direct) return toHex(direct);
  if (!context) return null;
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = "#000";
  context.fillStyle = computed;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return toHex([r, g, b]);
}

/** Calls `onChange` (once per frame at most) when html[data-theme] or the system colour scheme changes. */
export function watchTheme(onChange: () => void): () => void {
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(onChange);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", schedule);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    media.removeEventListener("change", schedule);
  };
}

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
