/**
 * Device tiers (BUILD_SPEC section 10). Pure logic, safe to import anywhere; the React context lives in
 * `device-tier-provider.tsx`.
 *
 * Owner: Director.
 *
 * - Tier A: desktop with WebGL2, or a high-end phone (8 GB class, 8+ cores, 4G). Everything, 3D diorama in WebGL.
 * - Tier B: the mid-range Android audience. Shorter pins, diorama as an image sequence, no Lenis.
 * - Tier C: save-data, 2G/3G or prefers-reduced-motion. Static images, fades only, no pinning, no parallax.
 *
 * Server render and first client render use SERVER_DEVICE (Tier C, ready false): the static, no-JS version.
 * Components enhance only when `ready` is true and the tier allows it.
 */

export type Tier = "A" | "B" | "C";

export interface TierSignals {
  reducedMotion: boolean;
  saveData: boolean;
  /** NetworkInformation.effectiveType: "slow-2g" | "2g" | "3g" | "4g"; undefined where unsupported (Safari, Firefox). */
  effectiveType?: string;
  /** navigator.deviceMemory in GB (0.25 to 8); undefined where unsupported. */
  deviceMemory?: number;
  hardwareConcurrency?: number;
  webgl2: boolean;
  /** (pointer: fine) and (hover: hover): mouse or trackpad. */
  finePointer: boolean;
  touch: boolean;
}

export interface DeviceInfo {
  tier: Tier;
  /** False on the server and before the first client effect: render the static version. */
  ready: boolean;
  reducedMotion: boolean;
  /** Desktop pointer: custom cursor, magnetic CTAs, hover previews. */
  finePointer: boolean;
  touch: boolean;
  webgl2: boolean;
  saveData: boolean;
  /** Lenis smooth wheel scrolling: Tier A on a fine pointer, never with reduced motion. */
  smoothScroll: boolean;
}

export const SERVER_DEVICE: DeviceInfo = {
  tier: "C",
  ready: false,
  reducedMotion: false,
  finePointer: false,
  touch: false,
  webgl2: false,
  saveData: false,
  smoothScroll: false,
};

const SLOW_NETWORKS = new Set(["slow-2g", "2g", "3g"]);
const HIGH_END_PHONE_MEMORY_GB = 8;
const HIGH_END_PHONE_CORES = 8;
const DESKTOP_MIN_MEMORY_GB = 4;

export const TIER_OVERRIDE_PARAM = "tier";
export const TIER_OVERRIDE_STORAGE_KEY = "pi-tier-override";

export function isTier(value: unknown): value is Tier {
  return value === "A" || value === "B" || value === "C";
}

export function detectTier(signals: TierSignals): Tier {
  if (signals.reducedMotion || signals.saveData) return "C";
  if (signals.effectiveType && SLOW_NETWORKS.has(signals.effectiveType)) return "C";
  if (!signals.webgl2) return "B";

  const fastNetwork = signals.effectiveType === undefined || signals.effectiveType === "4g";
  if (!fastNetwork) return "B";

  if (signals.finePointer && !signals.touch) {
    const memoryOk = signals.deviceMemory === undefined || signals.deviceMemory >= DESKTOP_MIN_MEMORY_GB;
    return memoryOk ? "A" : "B";
  }

  const highEndPhone =
    signals.deviceMemory !== undefined &&
    signals.deviceMemory >= HIGH_END_PHONE_MEMORY_GB &&
    (signals.hardwareConcurrency ?? 0) >= HIGH_END_PHONE_CORES;
  return highEndPhone ? "A" : "B";
}

export function toDeviceInfo(signals: TierSignals, override?: Tier): DeviceInfo {
  // Reduced motion always wins over a QA override: content must stay reachable without animation.
  const tier = signals.reducedMotion ? "C" : (override ?? detectTier(signals));
  return {
    tier,
    ready: true,
    reducedMotion: signals.reducedMotion,
    finePointer: signals.finePointer,
    touch: signals.touch,
    webgl2: signals.webgl2,
    saveData: signals.saveData,
    smoothScroll: tier === "A" && signals.finePointer && !signals.reducedMotion,
  };
}

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

function hasWebgl2(doc: Document): boolean {
  try {
    const canvas = doc.createElement("canvas");
    const ctx = canvas.getContext("webgl2");
    const ok = ctx !== null;
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

/** Reads the browser signals. Call only on the client. */
export function readTierSignals(win: Window = window): TierSignals {
  const nav = win.navigator as Navigator & {
    connection?: NetworkInformationLike;
    deviceMemory?: number;
  };
  const media = (query: string) => win.matchMedia?.(query).matches ?? false;
  return {
    reducedMotion: media("(prefers-reduced-motion: reduce)"),
    saveData: nav.connection?.saveData === true,
    effectiveType: nav.connection?.effectiveType,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    webgl2: hasWebgl2(win.document),
    finePointer: media("(pointer: fine)") && media("(hover: hover)"),
    touch: (nav.maxTouchPoints ?? 0) > 0 || media("(pointer: coarse)"),
  };
}

/**
 * QA override: `?tier=A|B|C` pins the tier for this browser session (Playwright uses it).
 * `?tier=auto` clears it.
 */
export function readTierOverride(win: Window = window): Tier | undefined {
  try {
    const param = new URL(win.location.href).searchParams.get(TIER_OVERRIDE_PARAM);
    if (param === "auto") {
      win.sessionStorage.removeItem(TIER_OVERRIDE_STORAGE_KEY);
      return undefined;
    }
    if (isTier(param)) {
      win.sessionStorage.setItem(TIER_OVERRIDE_STORAGE_KEY, param);
      return param;
    }
    const stored = win.sessionStorage.getItem(TIER_OVERRIDE_STORAGE_KEY);
    return isTier(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}
