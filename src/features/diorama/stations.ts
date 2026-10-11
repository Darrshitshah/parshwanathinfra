/**
 * Camera stations for the diorama (S4). Owner: scene-lead.
 *
 * One station per Living Plan chapter plus the overview. The camera maths mirrors tools/blender/cameras.py and is driven by
 * the `camera` block of scene-meta.json, so the WebGL scene, the stills and the scroll sequence look at the same places.
 * Scroll progress 0..1 maps to the chain of stations with a hold at each; the pre-rendered sequence uses the same timeline.
 */
import type { Chapter } from "@/content/schema";
import meta from "./scene-meta.json";

export type Vec3 = readonly [number, number, number];

export interface CameraConfig {
  azimuthDeg: number;
  elevationDeg: number;
  hfovDeg: number;
  targetZ: number;
  margin: number;
  aspect: number;
}

export interface SceneMeta {
  metresPerPx: number;
  originPx: readonly [number, number];
  floorHeightM: number;
  buildings: ReadonlyArray<{ id: string; typology: string; floorsUsed: number; heightM: number; indicative: boolean }>;
  camera: CameraConfig & { stations: ReadonlyArray<{ id: string; view: readonly number[] }> };
}

export const sceneMeta = meta as unknown as SceneMeta;
export const OVERVIEW_ID = "overview";
/** Share of each segment spent holding at the station at either end; the travel in between is eased. */
export const HOLD_SHARE = 0.2;
const AIM_DISTANCE_M = 600;

export interface Station {
  id: string;
  /** Grid view box [x, y, w, h]. */
  view: readonly [number, number, number, number];
  position: Vec3;
  target: Vec3;
}

/** Grid px (x right, y down) to world metres in three.js axes (x right, y up, z towards the viewer / plan south). */
export function gridToWorld([px, py]: readonly [number, number], height = 0, m: SceneMeta = sceneMeta): Vec3 {
  return [(px - m.originPx[0]) * m.metresPerPx, height, (py - m.originPx[1]) * m.metresPerPx];
}

export function stationPose(view: readonly [number, number, number, number], m: SceneMeta = sceneMeta): { position: Vec3; target: Vec3 } {
  const cfg = m.camera;
  const [x, y, w, h] = view;
  const az = (cfg.azimuthDeg * Math.PI) / 180;
  const el = (cfg.elevationDeg * Math.PI) / 180;
  const widthM = w * m.metresPerPx;
  const heightM = h * m.metresPerPx;
  const extent = widthM * Math.abs(Math.cos(az)) + heightM * Math.abs(Math.sin(az));
  const distance = (extent * cfg.margin) / (2 * Math.tan((cfg.hfovDeg * Math.PI) / 360));
  const target = gridToWorld([x + w / 2, y + h / 2], cfg.targetZ, m);
  const direction: Vec3 = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
  const position: Vec3 = [target[0] + direction[0] * distance, target[1] + direction[1] * distance, target[2] + direction[2] * distance];
  return { position, target };
}

type View = readonly [number, number, number, number];
const asView = (v: readonly number[]): View => [v[0], v[1], v[2], v[3]];

/** The overview first, then one station per chapter, in chapter order. Chapters supply the view boxes. */
export function buildStations(chapters: ReadonlyArray<Pick<Chapter, "id" | "view">>, m: SceneMeta = sceneMeta): Station[] {
  const overview = m.camera.stations.find((s) => s.id === OVERVIEW_ID);
  if (!overview) throw new Error("scene-meta.json has no overview station");
  const list = [{ id: OVERVIEW_ID, view: asView(overview.view) }, ...chapters.map((c) => ({ id: c.id, view: asView(c.view) }))];
  return list.map(({ id, view }) => ({ id, view, ...stationPose(view, m) }));
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp3 = (a: Vec3, b: Vec3, k: number): Vec3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

function aimPoint(s: Station): Vec3 {
  const d: Vec3 = [s.target[0] - s.position[0], s.target[1] - s.position[1], s.target[2] - s.position[2]];
  const len = Math.hypot(...d) || 1;
  return [s.position[0] + (d[0] / len) * AIM_DISTANCE_M, s.position[1] + (d[1] / len) * AIM_DISTANCE_M, s.position[2] + (d[2] / len) * AIM_DISTANCE_M];
}

/** Segment index and eased travel (0..1) at scroll progress p, the same timeline the Blender sequence uses. */
export function segmentAt(stationCount: number, progress: number): { segment: number; travel: number } {
  const segments = Math.max(1, stationCount - 1);
  const p = clamp01(progress);
  const segment = Math.min(Math.floor(p * segments), segments - 1);
  const local = p * segments - segment;
  return { segment, travel: smoothstep(clamp01((local - HOLD_SHARE) / (1 - 2 * HOLD_SHARE))) };
}

export function poseAtProgress(stations: readonly Station[], progress: number): { position: Vec3; aim: Vec3 } {
  const { segment, travel } = segmentAt(stations.length, progress);
  const a = stations[segment];
  const b = stations[Math.min(segment + 1, stations.length - 1)];
  return { position: lerp3(a.position, b.position, travel), aim: lerp3(aimPoint(a), aimPoint(b), travel) };
}

/** The station the camera is nearest to (the one whose caption shows). */
export function activeStationIndex(stationCount: number, progress: number): number {
  const { segment, travel } = segmentAt(stationCount, progress);
  return Math.min(segment + (travel >= 0.5 ? 1 : 0), stationCount - 1);
}

/** Vertical field of view for a canvas: the horizontal field stays fixed, so a narrow screen still sees the whole width. */
export function verticalFovDeg(canvasAspect: number, m: SceneMeta = sceneMeta): number {
  const half = Math.tan((m.camera.hfovDeg * Math.PI) / 360);
  return (2 * Math.atan(half / canvasAspect) * 180) / Math.PI;
}

/** Roof height of a building by plan id (for label anchors); undefined for ids the model does not contain. */
export function buildingHeight(id: string, m: SceneMeta = sceneMeta): number | undefined {
  return m.buildings.find((b) => b.id === id)?.heightM;
}

export interface LabelAnchor {
  id: string;
  label: string;
  tbd: boolean;
  /** Plan building id when the hotspot is a building (the click target), else undefined. */
  buildingId?: string;
  position: Vec3;
}

const LABEL_LIFT_M = 3;
const GROUND_LABEL_HEIGHT_M = 4;

/** Hotspots of a chapter as world-space label anchors. Heights come from the model, positions from the plan. */
export function labelAnchors(chapter: Pick<Chapter, "hotspots">, m: SceneMeta = sceneMeta): LabelAnchor[] {
  return chapter.hotspots.map((h) => {
    const buildingId = h.ref?.startsWith("b-") ? h.ref.slice(2) : undefined;
    const roof = buildingId ? buildingHeight(buildingId, m) : undefined;
    const height = roof !== undefined ? roof + LABEL_LIFT_M : GROUND_LABEL_HEIGHT_M;
    return { id: h.id, label: h.label, tbd: h.labelTbd, buildingId: roof !== undefined ? buildingId : undefined, position: gridToWorld(h.point, height, m) };
  });
}
