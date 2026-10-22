"""Block matching between two images on blurred gradient-magnitude maps -> displacement field -> RANSAC homography.
Usage: reg_blocks.py  (runs clay->kf for 3,4,5 and kf->kf for 3-4, 4-5, 3-5). Coords reported at 3840x2160."""
import json
import pathlib
import sys

import cv2
import numpy as np

ROOT = pathlib.Path("/Users/darshit/CLAUDE the GOD/Parshwanath portfolio ")
KF = ROOT / "_source/generated/hero-keyframes/frames-4k"
CL = ROOT / "_source/generated/hero-stages"
OUT = ROOT / "_source/generated/hero-keyframes/aligned/registration"
OUT.mkdir(parents=True, exist_ok=True)
W, H = 3840, 2160
WW = 1920
S = WW / W
IMG = {
    "kf3": KF / "stage-3.jpg", "kf4": KF / "stage-4.jpg", "kf5": KF / "stage-5.jpg",
    "clay3": CL / "stage-3.png", "clay4": CL / "stage-4-floors.png", "clay5": CL / "stage-5-floors-warm.png",
}


def load(name):
    im = cv2.imread(str(IMG[name]), cv2.IMREAD_COLOR)
    return cv2.resize(im, (WW, round(WW * 9 / 16)), interpolation=cv2.INTER_AREA)


def grad(im, sigma=1.5):
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
    g = cv2.GaussianBlur(g, (0, 0), 1.0)
    gx = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
    m = np.sqrt(gx * gx + gy * gy)
    m = np.log1p(m)  # compress dynamic range so clay and photo are comparable
    return cv2.GaussianBlur(m, (0, 0), sigma)


def site_mask(clay):
    h, w = clay.shape[:2]
    ground = np.median(clay[int(h * 0.6):int(h * 0.7), int(w * 0.02):int(w * 0.08)].reshape(-1, 3), axis=0)
    diff = np.abs(clay.astype(np.int16) - ground.astype(np.int16)).sum(axis=2)
    site = (diff > 18).astype(np.uint8)
    site[: int(h * 0.30)] = 0
    site = cv2.morphologyEx(site, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    return cv2.dilate(site, np.ones((15, 15), np.uint8))


def blocks(a, b, mask, ps=96, step=48, search=64, min_std=0.08, min_peak=0.35, min_ratio=1.08):
    """For patches of a (template) find displacement into b. Returns centres (in a) and displacement vectors."""
    h, w = a.shape
    cs, ds, scores = [], [], []
    for y in range(search, h - ps - search, step):
        for x in range(search, w - ps - search, step):
            if mask is not None and mask[y:y + ps, x:x + ps].mean() < 0.5:
                continue
            t = a[y:y + ps, x:x + ps]
            if t.std() < min_std:
                continue
            win = b[y - search:y + ps + search, x - search:x + ps + search]
            r = cv2.matchTemplate(win, t, cv2.TM_CCOEFF_NORMED)
            _, mx, _, loc = cv2.minMaxLoc(r)
            if mx < min_peak:
                continue
            # distinctness: best peak outside a 9px radius
            r2 = r.copy()
            cv2.circle(r2, loc, 9, -1, -1)
            second = r2.max()
            if second > 0 and mx / max(second, 1e-6) < min_ratio:
                continue
            # subpixel refine
            lx, ly = loc
            dx = dy = 0.0
            if 0 < lx < r.shape[1] - 1:
                l, c, rr = r[ly, lx - 1], r[ly, lx], r[ly, lx + 1]
                den = l - 2 * c + rr
                dx = 0.5 * (l - rr) / den if abs(den) > 1e-6 else 0
            if 0 < ly < r.shape[0] - 1:
                u, c, d = r[ly - 1, lx], r[ly, lx], r[ly + 1, lx]
                den = u - 2 * c + d
                dy = 0.5 * (u - d) / den if abs(den) > 1e-6 else 0
            cs.append((x + ps / 2, y + ps / 2))
            ds.append((lx + dx - search, ly + dy - search))
            scores.append(mx)
    return np.float64(cs), np.float64(ds), np.float64(scores)


def fit_h(cs, ds, thr=3.0):
    src = cs.astype(np.float32)
    dst = (cs + ds).astype(np.float32)
    Hm, inl = cv2.findHomography(src, dst, cv2.USAC_MAGSAC, thr, maxIters=20000, confidence=0.9999)
    return Hm, inl.ravel().astype(bool)


def to_full(Hm):
    Sm = np.diag([S, S, 1.0])
    return np.linalg.inv(Sm) @ Hm @ Sm


def apply_h(Hm, pts):
    p = np.c_[pts, np.ones(len(pts))] @ Hm.T
    return p[:, :2] / p[:, 2:3]


def draw_field(base, cs, ds, inl, name, gain=4):
    can = base.copy()
    for (x, y), (dx, dy), ok in zip(cs, ds, inl):
        col = (0, 255, 0) if ok else (0, 0, 255)
        cv2.arrowedLine(can, (int(x), int(y)), (int(x + gain * dx), int(y + gain * dy)), col, 2, tipLength=0.25)
    cv2.imwrite(str(OUT / name), cv2.resize(can, (1600, 900)), [cv2.IMWRITE_JPEG_QUALITY, 85])


def run(src, dst, use_mask_from=None, verbose=True):
    A, B = load(src), load(dst)
    ga, gb = grad(A), grad(B)
    # normalise each map to unit-ish scale
    ga = (ga - ga.mean()) / (ga.std() + 1e-6)
    gb = (gb - gb.mean()) / (gb.std() + 1e-6)
    mask = site_mask(load(use_mask_from)) if use_mask_from else None
    if mask is None:
        mask = np.zeros(ga.shape, np.uint8)
        mask[int(ga.shape[0] * 0.33):] = 1
    cs, ds, sc = blocks(ga, gb, mask, min_std=0.3)
    if len(cs) < 8:
        print(f"{src}->{dst}: too few blocks ({len(cs)})")
        return None
    Hm, inl = fit_h(cs, ds)
    Hf = to_full(Hm)
    Hf /= Hf[2, 2]
    pred = apply_h(Hm, cs) - cs
    resid = np.linalg.norm(pred - ds, axis=1)
    med_raw = np.median(np.linalg.norm(ds, axis=1)) / S
    corners = np.float64([[0, 0], [W, 0], [W, H], [0, H], [W / 2, H / 2]])
    sh = apply_h(Hf, corners) - corners
    draw_field(B, cs, ds, inl, f"field-{src}-{dst}.jpg")
    info = dict(blocks=int(len(cs)), inliers=int(inl.sum()), median_block_disp_px=float(med_raw),
                mean_disp_inliers_px=(ds[inl].mean(0) / S).tolist(), resid_med_px=float(np.median(resid[inl]) / S),
                H=Hf.tolist(), corner_shift=sh.tolist())
    if verbose:
        print(f"{src}->{dst}: blocks {len(cs)} inliers {inl.sum()} | median |disp| {med_raw:.1f}px | mean inlier disp "
              f"({info['mean_disp_inliers_px'][0]:+.1f},{info['mean_disp_inliers_px'][1]:+.1f}) | homog resid med {info['resid_med_px']:.1f}px")
        print("   corner shifts @3840 (TL,TR,BR,BL,C):", " ".join(f"({x:+.0f},{y:+.0f})" for x, y in sh))
    return info


if __name__ == "__main__":
    res = {}
    for k in (3, 4, 5):
        res[f"clay{k}->kf{k}"] = run(f"clay{k}", f"kf{k}", use_mask_from=f"clay{k}")
    for a, b in (("kf4", "kf3"), ("kf5", "kf4"), ("kf5", "kf3")):
        res[f"{a}->{b}"] = run(a, b, use_mask_from="clay" + a[-1])
    (OUT / "blocks.json").write_text(json.dumps(res, indent=1))
