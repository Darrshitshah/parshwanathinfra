/** Small polygon helpers for the plan build (render grid, y down). */

/** Polygon around a polyline: `halfWidth` each side, mitred joins (limited), flat ends. */
export function offsetPolyline(points, halfWidth, miterLimit = 2.2) {
  const n = points.length;
  const left = [];
  const right = [];
  for (let i = 0; i < n; i += 1) {
    const prev = points[Math.max(i - 1, 0)];
    const next = points[Math.min(i + 1, n - 1)];
    const cur = points[i];
    const unit = (a, b) => {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      return [dx / len, dy / len];
    };
    const d1 = i === 0 ? unit(cur, next) : unit(prev, cur);
    const d2 = i === n - 1 ? unit(prev, cur) : unit(cur, next);
    const n1 = [-d1[1], d1[0]];
    const n2 = [-d2[1], d2[0]];
    let mx = n1[0] + n2[0];
    let my = n1[1] + n2[1];
    const ml = Math.hypot(mx, my);
    if (ml < 1e-6) {
      mx = n1[0];
      my = n1[1];
    } else {
      mx /= ml;
      my /= ml;
    }
    const cos = Math.max(mx * n1[0] + my * n1[1], 1 / miterLimit);
    const k = halfWidth / cos;
    left.push([cur[0] + mx * k, cur[1] + my * k]);
    right.push([cur[0] - mx * k, cur[1] - my * k]);
  }
  return [...left, ...right.reverse()];
}

/** Keep the part of a polygon with x <= xmax (Sutherland and Hodgman against one edge). */
export function clipPolygonMaxX(poly, xmax) {
  const out = [];
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ain = a[0] <= xmax;
    const bin = b[0] <= xmax;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (xmax - a[0]) / (b[0] - a[0]);
      out.push([xmax, a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

/** Rectangle [x, y, w, h] with corner radius r as a polygon (r = 0 gives 4 corners). */
export function roundedRectPolygon([x, y, w, h, r = 0], segments = 5) {
  if (!r) {
    return [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ];
  }
  const out = [];
  const corner = (cx, cy, start) => {
    for (let k = 0; k <= segments; k += 1) {
      const a = start + (k / segments) * (Math.PI / 2);
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  corner(x + w - r, y + r, -Math.PI / 2);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI / 2);
  corner(x + r, y + r, Math.PI);
  return out;
}

export function polygonBounds(poly) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
