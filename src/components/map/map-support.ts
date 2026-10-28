/**
 * Whether this browser should get the live map: it needs WebGL, and a visitor who asked to save data keeps the
 * schematic (the map is about 300 KB of code plus tiles). Tiny on purpose, it runs in the client shell before the map
 * code is imported. Owner: pages-lead.
 */
interface NavigatorWithConnection extends Navigator {
  connection?: { saveData?: boolean };
}

export function canShowLiveMap(win: Window = window): boolean {
  if ((win.navigator as NavigatorWithConnection).connection?.saveData) return false;
  try {
    const canvas = win.document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Checked once per page: each check creates a WebGL context, and browsers cap how many may exist. */
let cached: boolean | undefined;

export function liveMapCapability(): boolean {
  cached ??= canShowLiveMap();
  return cached;
}

/** Tests stub WebGL per case, so they clear the cache between cases. */
export function resetLiveMapCapability(): void {
  cached = undefined;
}
