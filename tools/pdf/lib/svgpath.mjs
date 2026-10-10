/**
 * Tiny SVG path helpers for the plan pipeline: parse the subset of path syntax Darshit's traced
 * geometry uses (M L H V C Z, absolute only), sample curves into polylines, and parse "x y x y ..." point strings.
 */

/** Parse "x y x y ..." into [[x, y], ...]. */
export function parsePoints(text) {
  const n = text.trim().split(/\s+/).map(Number);
  if (n.length % 2 !== 0 || n.some(Number.isNaN)) throw new Error(`Bad point string: ${text}`);
  const out = [];
  for (let i = 0; i < n.length; i += 2) out.push([n[i], n[i + 1]]);
  return out;
}

function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

/**
 * Sample an absolute SVG path (M L H V C Z) into one polyline per subpath.
 * Curves are sampled with `steps` segments.
 */
export function samplePath(d, steps = 16) {
  const tokens = d.match(/[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const lines = [];
  let current = [];
  let pos = [0, 0];
  let i = 0;
  const num = () => Number(tokens[i++]);
  let cmd = "";
  while (i < tokens.length) {
    if (/^[MLHVCZ]$/i.test(tokens[i])) cmd = tokens[i++].toUpperCase();
    switch (cmd) {
      case "M": {
        if (current.length) lines.push(current);
        pos = [num(), num()];
        current = [pos];
        cmd = "L";
        break;
      }
      case "L": {
        pos = [num(), num()];
        current.push(pos);
        break;
      }
      case "H": {
        pos = [num(), pos[1]];
        current.push(pos);
        break;
      }
      case "V": {
        pos = [pos[0], num()];
        current.push(pos);
        break;
      }
      case "C": {
        const p1 = [num(), num()];
        const p2 = [num(), num()];
        const p3 = [num(), num()];
        for (let s = 1; s <= steps; s += 1) current.push(cubic(pos, p1, p2, p3, s / steps));
        pos = p3;
        break;
      }
      case "Z": {
        if (current.length) lines.push(current);
        current = [];
        break;
      }
      default:
        throw new Error(`Unsupported path command near token ${tokens[i]}`);
    }
  }
  if (current.length) lines.push(current);
  return lines;
}

/** Round coordinates to a fixed number of decimals. */
export function roundPoint(p, decimals = 1) {
  const f = 10 ** decimals;
  return [Math.round(p[0] * f) / f, Math.round(p[1] * f) / f];
}

/** Axis aligned rectangle [x, y, w, h] to a 4 point polygon. */
export function rectPolygon([x, y, w, h]) {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
}

/** Ellipse [cx, cy, rx, ry] to a polygon with `n` points. */
export function ellipsePolygon([cx, cy, rx, ry], n = 28) {
  const out = [];
  for (let k = 0; k < n; k += 1) {
    const a = (k / n) * Math.PI * 2;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

/** Signed polygon area (shoelace), positive for clockwise on a y-down grid. */
export function polygonArea(poly) {
  let a = 0;
  for (let k = 0; k < poly.length; k += 1) {
    const [x1, y1] = poly[k];
    const [x2, y2] = poly[(k + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

export function centroid(poly) {
  const a = polygonArea(poly);
  if (Math.abs(a) < 1e-9) {
    return [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length];
  }
  let cx = 0;
  let cy = 0;
  for (let k = 0; k < poly.length; k += 1) {
    const [x1, y1] = poly[k];
    const [x2, y2] = poly[(k + 1) % poly.length];
    const f = x1 * y2 - x2 * y1;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  return [cx / (6 * a), cy / (6 * a)];
}
