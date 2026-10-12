"""Match a Blender camera to the SS-01 hero aerial (owner: diorama-lead).

    tools/.venv-blender/bin/python tools/blender/hero_camera.py [--overlay <dir>]

Reads ground control points from `hero_gcps.json` (plan px + height <-> pixel in the 2000 px wide aerial), solves position,
rotation and focal length by Levenberg-Marquardt least squares (numpy only), reports the reprojection error in px on the
2000 px wide frame and writes `hero_camera.json` (used by render_stages.py). With --overlay it also renders the clay model
from the solved camera at the photo's size and saves overlay.png (clay at 40% over the photo) and clay.png.

Residuals: point GCPs (px), the projected plan polyline of a road against its observed polyline (px, perpendicular), the
horizon row (px) and weak priors on elevation and field of view so that a handful of points cannot run away.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy  # noqa: F401  (must load before bmesh, which common imports)
import numpy as np

from common import ROOT, Frame, load_plan

GCP_PATH = Path(__file__).resolve().parent / "hero_gcps.json"
CAMERA_PATH = Path(__file__).resolve().parent / "hero_camera.json"
AERIAL = ROOT / "public/media/masterplan-aerial.webp"
PRIOR_ELEV_DEG = (12.0, 75.0)
PRIOR_HFOV_DEG = (30.0, 100.0)
HORIZON_WEIGHT = 0.3  # the hazy horizon of the render is not a reliable cue; it is only reported


def euler_to_matrix(rx: float, ry: float, rz: float) -> np.ndarray:
    """Blender XYZ euler (camera to world)."""
    cx, sx, cy, sy, cz, sz = math.cos(rx), math.sin(rx), math.cos(ry), math.sin(ry), math.cos(rz), math.sin(rz)
    rxm = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    rym = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    rzm = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return rzm @ rym @ rxm


def project(params, pts: np.ndarray, size) -> tuple[np.ndarray, np.ndarray]:
    """World points (n,3) to pixels (n,2) and the depth in front of the camera."""
    c, rot, logf = params[:3], params[3:6], params[6]
    f = math.exp(logf)
    r = euler_to_matrix(*rot)
    pc = (pts - c) @ r  # R^T (p - c)
    depth = -pc[:, 2]
    safe = np.where(depth > 1e-6, depth, 1e-6)
    x = size[0] / 2 + f * pc[:, 0] / safe
    y = size[1] / 2 - f * pc[:, 1] / safe
    return np.stack([x, y], axis=1), depth


def seg_dist(pt, poly) -> float:
    best = 1e18
    for a, b in zip(poly, poly[1:]):
        ab = b - a
        t = np.clip(np.dot(pt - a, ab) / (np.dot(ab, ab) + 1e-12), 0.0, 1.0)
        best = min(best, float(np.linalg.norm(pt - (a + ab * t))))
    return best


def polyline_distance(pt, proj: np.ndarray, depth: np.ndarray, miss: float = 600.0) -> float:
    """Distance from an observed point to the projected polyline (segments with both ends in front of the camera)."""
    a, b = proj[:-1], proj[1:]
    ok = (depth[:-1] > 0) & (depth[1:] > 0)
    if not ok.any():
        return miss
    a, b = a[ok], b[ok]
    ab = b - a
    t = np.clip(np.einsum("ij,ij->i", pt - a, ab) / (np.einsum("ij,ij->i", ab, ab) + 1e-12), 0.0, 1.0)
    d = np.linalg.norm(pt - (a + ab * t[:, None]), axis=1)
    return float(min(miss, d.min()))


class Problem:
    def __init__(self):
        cfg = json.loads(GCP_PATH.read_text())
        plan = load_plan()
        self.frame = Frame(plan)
        self.size = cfg["frame"]
        self.horizon_y = cfg["horizonY"]
        self.pts3, self.pts_img, self.pt_ids = [], [], []
        for p in cfg["points"]:
            x, y = self.frame.xy(p["plan"])
            self.pts3.append((x, y, p["z"]))
            self.pts_img.append(p["img"])
            self.pt_ids.append(p["id"])
        self.pts3, self.pts_img = np.array(self.pts3), np.array(self.pts_img, dtype=float)
        self.lines = []
        for ln in cfg["lines"]:
            road = next(r for r in plan["roads"] if r["id"] == ln["road"])
            cl = np.array(self.frame.pts(road["centerline"]))
            dense = []
            for a, b in zip(cl, cl[1:]):
                n = max(1, int(np.linalg.norm(b - a) / 6.0))
                dense += [a + (b - a) * k / n for k in range(n)]
            dense = np.array(dense)
            off = float(ln.get("offsetM", 0.0))
            if off:  # edge of the carriageway: shift each sample along the left normal of the centreline
                tang = np.gradient(dense, axis=0)
                tang /= np.linalg.norm(tang, axis=1, keepdims=True) + 1e-12
                dense = dense + off * np.stack([-tang[:, 1], tang[:, 0]], axis=1)
            self.lines.append((np.c_[dense, np.zeros(len(dense))], np.array(ln["img"], dtype=float)))

    @staticmethod
    def observed_samples(obs: np.ndarray, step: float = 25.0) -> list[np.ndarray]:
        """Dense points along the observed polyline, so the residual count never changes during the fit."""
        out = []
        for a, b in zip(obs, obs[1:]):
            n = max(1, int(np.linalg.norm(b - a) / step))
            out += [a + (b - a) * k / n for k in range(n)]
        return out

    def residuals(self, params, detail=False):
        res, parts = [], {"points": [], "lines": [], "horizon": [], "prior": []}
        px, depth = project(params, self.pts3, self.size)
        for i in range(len(px)):
            d = (px[i] - self.pts_img[i]) if depth[i] > 0 else np.array([1e3, 1e3])
            res += list(d)
            parts["points"].append(float(np.linalg.norm(d)))
        for world, obs in self.lines:
            lp, ld = project(params, world, self.size)
            for o in self.observed_samples(obs):
                d = polyline_distance(o, lp, ld)
                res.append(d)
                parts["lines"].append(d)
        # horizon: far points on horizontal directions, rows should sit at horizon_y
        for az in np.linspace(0, math.tau, 24, endpoint=False):
            far = params[:3] + np.array([math.cos(az), math.sin(az), 0.0]) * 1e6
            q, dpt = project(params, far[None, :], self.size)
            inside = dpt[0] > 0 and -200 <= q[0, 0] <= self.size[0] + 200
            res.append(HORIZON_WEIGHT * (q[0, 1] - self.horizon_y) if inside else 0.0)  # fixed residual count
            if inside:
                parts["horizon"].append(abs(q[0, 1] - self.horizon_y))
        # priors: elevation of the optical axis below the horizon and horizontal field of view
        r = euler_to_matrix(*params[3:6])
        axis = r @ np.array([0, 0, -1.0])
        elev = math.degrees(math.asin(-axis[2]))
        hfov = math.degrees(2 * math.atan(self.size[0] / 2 / math.exp(params[6])))
        for val, (lo, hi) in ((elev, PRIOR_ELEV_DEG), (hfov, PRIOR_HFOV_DEG)):
            pen = 40.0 * max(0.0, lo - val, val - hi)
            res.append(pen)
            parts["prior"].append(pen)
        return (np.array(res), parts) if detail else np.array(res)


def lm(problem: Problem, p0, iters=120):
    p = np.array(p0, dtype=float)
    lam = 1e-2
    r = problem.residuals(p)
    cost = float(r @ r)
    for _ in range(iters):
        J = np.empty((len(r), len(p)))
        for k in range(len(p)):
            h = 1e-5 * max(1.0, abs(p[k])) if k < 3 else 1e-6
            dp = p.copy()
            dp[k] += h
            rk = problem.residuals(dp)
            J[:, k] = (rk - r) / h
        A, g = J.T @ J, J.T @ r
        improved = False
        for _try in range(8):
            try:
                step = np.linalg.solve(A + lam * np.diag(np.diag(A) + 1e-9), -g)
            except np.linalg.LinAlgError:
                lam *= 10
                continue
            trial = p + step
            rt = problem.residuals(trial)
            if len(rt) == len(r) and float(rt @ rt) < cost:
                p, r, cost, lam, improved = trial, rt, float(rt @ rt), max(lam / 3, 1e-9), True
                break
            lam *= 4
        if not improved or np.linalg.norm(step) < 1e-7:
            break
    return p, cost


def initial_guesses(problem: Problem):
    from mathutils import Vector

    target = Vector(problem.pts3[:, :2].mean(axis=0).tolist() + [5.0]) if len(problem.pts3) else Vector((0, 0, 5))
    for az in (-45, -30, -15, 0, 15):
        for el in (25, 40, 55):
            for dist in (200, 350, 600):
                a, e = math.radians(az), math.radians(el)
                pos = target + Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e))) * dist
                rot = (target - pos).to_track_quat("-Z", "Y").to_euler()
                yield [pos.x, pos.y, pos.z, rot.x, rot.y, rot.z, math.log(problem.size[0] / 2 / math.tan(math.radians(27.5)))]


def solve(problem: Problem):
    best = None
    for p0 in initial_guesses(problem):
        try:
            p, cost = lm(problem, p0)
        except Exception:
            continue
        if best is None or cost < best[1]:
            best = (p, cost)
    return best


def describe(problem: Problem, p):
    _, parts = problem.residuals(p, detail=True)
    rms = lambda v: float(np.sqrt(np.mean(np.square(v)))) if v else 0.0
    allv = parts["points"] + parts["lines"] + parts["horizon"]
    f = math.exp(p[6])
    return {
        "reprojectionRmsPx": round(rms(allv), 1),
        "pointRmsPx": round(rms(parts["points"]), 1),
        "pointErrorsPx": {i: round(v, 1) for i, v in zip(problem.pt_ids, parts["points"])},
        "lineRmsPx": round(rms(parts["lines"]), 1),
        "horizonRmsPx": round(rms(parts["horizon"]), 1),
        "priorPenalty": round(sum(parts["prior"]), 1),
        "hfovDeg": round(math.degrees(2 * math.atan(problem.size[0] / 2 / f)), 1),
        "vfovDeg": round(math.degrees(2 * math.atan(problem.size[1] / 2 / f)), 1),
        "focalPx": round(f, 1),
    }


def save(problem: Problem, p, stats):
    r = euler_to_matrix(*p[3:6])
    axis = r @ np.array([0, 0, -1.0])
    out = {
        "note": "Solved by tools/blender/hero_camera.py. Position in metres (Blender world, frame centred on the site), rotation = Blender XYZ euler in radians.",
        "frame": problem.size,
        "position": [round(float(v), 3) for v in p[:3]],
        "rotationEuler": [round(float(v), 6) for v in p[3:6]],
        "focalPx": round(math.exp(p[6]), 3),
        "elevationDeg": round(math.degrees(math.asin(-axis[2])), 2),
        "azimuthDeg": round(math.degrees(math.atan2(axis[0], axis[1])) % 360, 1),
        "stats": stats,
    }
    CAMERA_PATH.write_text(json.dumps(out, indent=1))
    return out


def render_overlay(cam: dict, out_dir: Path) -> None:
    import bpy

    from cameras import setup_lighting
    from common import BLEND_PATH

    bpy.ops.wm.open_mainfile(filepath=str(BLEND_PATH))
    scene = bpy.context.scene
    for o in [o for o in scene.objects if o.type in ("CAMERA", "LIGHT")]:
        bpy.data.objects.remove(o, do_unlink=True)
    setup_lighting(scene)
    w, h = 2048, 1374  # the aerial's own size
    data = bpy.data.cameras.new("hero")
    data.sensor_fit = "VERTICAL"
    data.angle_y = 2 * math.atan(cam["frame"][1] / 2 / cam["focalPx"])
    data.clip_start, data.clip_end = 2.0, 6000.0
    obj = bpy.data.objects.new("hero", data)
    scene.collection.objects.link(obj)
    obj.location = cam["position"]
    obj.rotation_euler = cam["rotationEuler"]
    scene.camera = obj
    from render_stills import configure

    configure(w, "EEVEE", 32)
    scene.render.resolution_y = h
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = "RGBA"
    out_dir.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(out_dir / "clay.png")
    bpy.ops.render.render(write_still=True)
    clay = bpy.data.images.load(str(out_dir / "clay.png"))
    photo = bpy.data.images.load(str(AERIAL))
    if tuple(photo.size) != (w, h):
        photo.scale(w, h)
    c = np.array(clay.pixels[:], dtype=np.float32).reshape(h, w, 4)
    ph = np.array(photo.pixels[:], dtype=np.float32).reshape(h, w, -1)[:, :, :3]
    a = c[:, :, 3:4] * 0.4
    mix = ph * (1 - a) + c[:, :, :3] * a
    res = bpy.data.images.new("overlay", w, h)
    res.pixels[:] = np.concatenate([mix, np.ones((h, w, 1), np.float32)], axis=2).ravel()
    res.filepath_raw = str(out_dir / "overlay.png")
    res.file_format = "PNG"
    res.save()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--overlay", default="")
    args = ap.parse_args()
    problem = Problem()
    p, cost = solve(problem)
    stats = describe(problem, p)
    cam = save(problem, p, stats)
    print(json.dumps({k: cam[k] for k in ("position", "elevationDeg", "azimuthDeg", "focalPx")}), json.dumps(stats))
    if args.overlay:
        render_overlay(cam, Path(args.overlay))


if __name__ == "__main__":
    main()
