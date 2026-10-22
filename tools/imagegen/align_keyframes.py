"""Camera-consistent hero keyframes in the stage-3 camera (owner: hero lead A). No model calls.

    ~/.local/bin/uv run --no-project --python 3.12 --with opencv-python-headless --with numpy python tools/imagegen/align_keyframes.py

Measurement (align_measure.py) shows the building site of stages 3, 4, 5 already shares the clay camera within ~0.5 % of the frame;
what differs between keyframes is the invented surroundings (horizon, farmland scale, kf5's foreground road loop). So:
  stage-4-aligned = kf4 warped by H(kf4->kf3) inside the site boundary + stage-4 frames (+ cranes), kf3 everywhere else
  stage-5-aligned = kf5 warped by H(kf5->kf3) inside the site boundary + stage-5 buildings/trees, kf3 everywhere else
H(k->3) = H(clay->kf3) . inv(H(clay->kfk)) from block matching (align_measure.run). Masks: hero_masks_blender.py (clay camera),
moved into the kf3 frame by H(clay->kf3). Seam: OpenCV graph cut inside a band around the boundary, then a feather that is wide
on the ground (dirt to dirt) and narrow along building silhouettes. Also writes stage-4-warp / stage-5-warp (pure homography).
Outputs: _source/generated/hero-keyframes/aligned/*.png (4K) + *.jpg (q95, video input) + aligned.json + review/ crops.
"""
from __future__ import annotations

import json
import pathlib
import sys

import cv2
import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import align_measure as AM  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
FR = ROOT / "_source/generated/hero-keyframes/frames-4k"
AL = ROOT / "_source/generated/hero-keyframes/aligned"
MK = AL / "masks"
RV = AL / "review"
W, H = 3840, 2160
GROUND_BAND = 72      # px each side of the site boundary where the seam may run (ground, dirt to dirt)
BUILD_GROW = 4        # px the building silhouettes are grown so no kf3 pixel eats a roofline
BUILD_BAND = 10       # px band outside the grown silhouette where the seam may run
FEATHER_GROUND = 12   # px soft edge on the ground seam (the graph cut already runs where both images agree)
FEATHER_BUILD = 2     # px soft edge along building silhouettes


def imread(p: pathlib.Path) -> np.ndarray:
    im = cv2.imread(str(p), cv2.IMREAD_COLOR)
    if im is None:
        raise FileNotFoundError(p)
    return im if im.shape[:2] == (H, W) else cv2.resize(im, (W, H), interpolation=cv2.INTER_CUBIC)


def mask(name: str) -> np.ndarray:
    m = cv2.imread(str(MK / f"{name}.png"), cv2.IMREAD_GRAYSCALE)
    if m is None:
        raise FileNotFoundError(MK / f"{name}.png")
    return (m > 127).astype(np.uint8)


def disk(r: int) -> np.ndarray:
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))


def homographies() -> dict:
    """clay->kf homographies (3840 frame) and the derived kf4->kf3, kf5->kf3."""
    info = {k: AM.run(f"clay{k}", f"kf{k}", use_mask_from=f"clay{k}", verbose=False) for k in (3, 4, 5)}
    Hc = {k: np.array(info[k]["H"]) for k in info}
    rel = {k: Hc[3] @ np.linalg.inv(Hc[k]) for k in (4, 5)}
    for k in rel:
        rel[k] /= rel[k][2, 2]
    return {"clay_to_kf": Hc, "kf_to_kf3": rel, "info": info}


def warp(img: np.ndarray, M: np.ndarray, interp: int = cv2.INTER_LANCZOS4) -> np.ndarray:
    return cv2.warpPerspective(img, M, (W, H), flags=interp, borderMode=cv2.BORDER_REFLECT)


# The two tower cranes of kf4 (boxes in the kf3 frame; the dry fields share the crane's hue, so colour only works inside a box).
CRANE_BOXES = ((2400, 830, 3260, 1400, 165), (380, 670, 960, 1000, 105))  # x0, y0, x1, y1, min saturation


def crane_mask(img: np.ndarray) -> np.ndarray:
    """Yellow lattice of kf4's tower cranes: strict colour inside the crane boxes, then only parts joined to a large structure."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.int32)
    raw = np.zeros((H, W), np.uint8)
    for x0, y0, x1, y1, smin in CRANE_BOXES:
        h, s, v = (hsv[y0:y1, x0:x1, i] for i in range(3))
        raw[y0:y1, x0:x1] = ((h >= 9) & (h <= 34) & (s >= smin) & (v >= 110)).astype(np.uint8)
    joined = cv2.morphologyEx(raw, cv2.MORPH_CLOSE, disk(4))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(joined, 8)
    keep = np.zeros_like(raw)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= 1500:
            keep[lab == i] = 1
    return cv2.dilate(raw & cv2.dilate(keep, disk(8)), disk(2))


def seam(inside: np.ndarray, outside: np.ndarray, core_in: np.ndarray, reach_in: np.ndarray) -> np.ndarray:
    """Graph-cut seam at half resolution between inside (warped kfk) and outside (kf3). Returns 0/1 mask of inside pixels."""
    s = 0.5
    sz = (round(W * s), round(H * s))
    imgs = [cv2.resize(x, sz, interpolation=cv2.INTER_AREA).astype(np.float32) for x in (inside, outside)]
    m_in = (cv2.resize(reach_in, sz, interpolation=cv2.INTER_NEAREST) * 255).astype(np.uint8)
    m_out = (cv2.resize(1 - core_in, sz, interpolation=cv2.INTER_NEAREST) * 255).astype(np.uint8)
    finder = cv2.detail_GraphCutSeamFinder("COST_COLOR_GRAD")
    res = finder.find(imgs, [(0, 0), (0, 0)], [m_in, m_out])
    r_in = res[0].get() if hasattr(res[0], "get") else res[0]
    full = (cv2.resize(r_in, (W, H), interpolation=cv2.INTER_LINEAR) > 127).astype(np.uint8)
    full[core_in > 0] = 1
    full[reach_in == 0] = 0
    return full


def soft_alpha(sel: np.ndarray, near_build: np.ndarray) -> np.ndarray:
    """Signed-distance feather; radius FEATHER_BUILD near building silhouettes, FEATHER_GROUND elsewhere."""
    d_in = cv2.distanceTransform(sel, cv2.DIST_L2, 5)
    d_out = cv2.distanceTransform(1 - sel, cv2.DIST_L2, 5)
    sd = np.where(sel > 0, d_in, -d_out)
    r = np.where(near_build > 0, FEATHER_BUILD, FEATHER_GROUND).astype(np.float32)
    r = cv2.GaussianBlur(r, (0, 0), 12)
    return np.clip(0.5 + sd / (2 * np.maximum(r, 1.0)), 0.0, 1.0)


def joint_ground_seam(kf3: np.ndarray, warped: dict, site: np.ndarray, grown: dict) -> np.ndarray:
    """One ground seam for every aligned stage, so the surroundings are pixel-identical between stage-4- and stage-5-aligned.
    Cost image = mean of the warped stages; building silhouettes outside the site are left out of the band (added per stage)."""
    outside_bld = cv2.dilate(np.maximum.reduce(list(grown.values())), disk(2)) & (1 - site)
    core_in = cv2.erode(site, disk(GROUND_BAND))
    reach_in = cv2.dilate(site, disk(GROUND_BAND)) & (1 - outside_bld)
    mean = np.mean([w.astype(np.float32) for w in warped.values()], axis=0).round().astype(np.uint8)
    return seam(mean, kf3, core_in, reach_in)


def composite(kf3: np.ndarray, warped: np.ndarray, ground: np.ndarray, grown: np.ndarray, site: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    sel = ground | grown
    near_build = cv2.dilate(grown, disk(BUILD_BAND + 6)) & (1 - cv2.erode(site, disk(8)))
    a = soft_alpha(sel, near_build)[..., None]
    out = (warped.astype(np.float32) * a + kf3.astype(np.float32) * (1 - a)).round().clip(0, 255).astype(np.uint8)
    return out, a[..., 0]


def review(name: str, img: np.ndarray, alpha: np.ndarray, kf3: np.ndarray) -> None:
    RV.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(RV / f"{name}-preview.jpg"), cv2.resize(img, (1920, 1080), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
    edge = cv2.Canny((alpha * 255).astype(np.uint8), 60, 180)
    ov = img.copy()
    ov[cv2.dilate(edge, disk(2)) > 0] = (255, 0, 255)
    cv2.imwrite(str(RV / f"{name}-seam.jpg"), cv2.resize(ov, (1920, 1080), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 85])
    diff = cv2.absdiff(img, kf3).max(axis=2)
    cv2.imwrite(str(RV / f"{name}-diff-vs-kf3.jpg"), cv2.resize(diff, (1920, 1080), interpolation=cv2.INTER_AREA))
    crops = {"roof-left": (100, 700, 1300, 1000), "roof-mid": (1300, 740, 2500, 1040), "roof-right": (2400, 780, 3600, 1300),
             "lower-left": (150, 1000, 1350, 1600), "lower-mid": (1300, 1380, 2500, 1980), "right": (2950, 1000, 3840, 2160)}
    for tag, (x0, y0, x1, y1) in crops.items():
        cv2.imwrite(str(RV / f"{name}-crop-{tag}.jpg"), img[y0:y1, x0:x1], [cv2.IMWRITE_JPEG_QUALITY, 90])


def main() -> None:
    AL.mkdir(parents=True, exist_ok=True)
    hs = homographies()
    kf3 = imread(FR / "stage-3.jpg")
    report = {"method": "homography warp of the site + kf3 surroundings (graph-cut seam, feathered)",
              "clay_to_kf": {k: v.tolist() for k, v in hs["clay_to_kf"].items()},
              "kf_to_kf3": {k: v.tolist() for k, v in hs["kf_to_kf3"].items()},
              "registration": {k: {x: hs["info"][k][x] for x in ("blocks", "inliers", "median_block_disp_px", "resid_med_px")} for k in hs["info"]},
              "outputs": {}}
    corners = np.float64([[0, 0], [W, 0], [W, H], [0, H], [W / 2, H / 2]])
    to3 = lambda m: (warp(m.astype(np.float32), hs["clay_to_kf"][3], cv2.INTER_LINEAR) > 0.5).astype(np.uint8)  # noqa: E731
    site = to3(mask("mask-site"))
    warped = {k: warp(imread(FR / f"stage-{k}.jpg"), hs["kf_to_kf3"][k]) for k in (4, 5)}
    cranes = crane_mask(warped[4])
    grown = {k: cv2.dilate(to3(mask(f"mask-b{k}")), disk(BUILD_GROW)) | (cranes if k == 4 else 0) for k in (4, 5)}
    ground = joint_ground_seam(kf3, warped, site, grown)
    cv2.imwrite(str(AL / "seam-ground.png"), ground * 255)
    cv2.imwrite(str(AL / "mask-cranes-kf3frame.png"), cranes * 255)
    for k in (4, 5):
        sh = AM.apply_h(hs["kf_to_kf3"][k], corners) - corners
        img, alpha = composite(kf3, warped[k], ground, grown[k], site)
        for stem, im in ((f"stage-{k}-aligned", img), (f"stage-{k}-warp", warped[k])):
            cv2.imwrite(str(AL / f"{stem}.png"), im)
            cv2.imwrite(str(AL / f"{stem}.jpg"), im, [cv2.IMWRITE_JPEG_QUALITY, 95])
        cv2.imwrite(str(AL / f"stage-{k}-alpha.png"), (alpha * 255).astype(np.uint8))
        review(f"stage-{k}-aligned", img, alpha, kf3)
        stats = dict(inside_share=float(alpha.mean()), crane_px=int(cranes.sum()) if k == 4 else 0, site_px=int(site.sum()))
        report["outputs"][f"stage-{k}"] = dict(corner_shift_kf_to_kf3=sh.tolist(), **stats)
        print(f"stage {k}: H(kf{k}->kf3) corner shifts", " ".join(f"({x:+.1f},{y:+.1f})" for x, y in sh), stats)
    a4 = cv2.imread(str(AL / "stage-4-alpha.png"), cv2.IMREAD_GRAYSCALE)
    a5 = cv2.imread(str(AL / "stage-5-alpha.png"), cv2.IMREAD_GRAYSCALE)
    env = (a4 == 0) & (a5 == 0)
    s4, s5 = (cv2.imread(str(AL / f"stage-{k}-aligned.png")) for k in (4, 5))
    report["env_identical_share"] = float(env.mean())
    report["env_max_abs_diff_4_vs_5"] = int(cv2.absdiff(s4, s5)[env].max()) if env.any() else None
    print("surroundings identical in both aligned frames over", f"{env.mean():.1%}", "of the frame, max diff", report["env_max_abs_diff_4_vs_5"])
    (AL / "aligned.json").write_text(json.dumps(report, indent=1))
    print("wrote", AL)


if __name__ == "__main__":
    main()
