import type { DeviceInfo } from "@/lib/device-tier";

export type DioramaMode = "webgl" | "sequence" | "still";

/** Tier A with WebGL2: the 3D scene. Tier B (or A without WebGL2): the image sequence. Tier C, reduced motion, not ready: the still. */
export function pickDioramaMode(device: Pick<DeviceInfo, "tier" | "ready" | "reducedMotion" | "webgl2">): DioramaMode {
  if (!device.ready || device.reducedMotion || device.tier === "C") return "still";
  if (device.tier === "A" && device.webgl2) return "webgl";
  return "sequence";
}
