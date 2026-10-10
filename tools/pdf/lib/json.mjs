/**
 * Compact JSON writer for plan data: coordinates stay on one line, structure stays readable and diffs stay small.
 * An array made only of numbers or [x, y] pairs is written inline, wrapped every `perLine` items when long.
 */
const isNum = (v) => typeof v === "number";
const isPair = (v) => Array.isArray(v) && v.length === 2 && v.every(isNum);

export function stringifyCompact(value, { indent = 1, perLine = 6 } = {}) {
  const pad = (depth) => " ".repeat(indent * depth);
  const fmt = (v, depth) => {
    if (v === null || typeof v !== "object") return JSON.stringify(v);
    if (Array.isArray(v)) {
      if (v.length === 0) return "[]";
      if (v.every(isNum)) return `[${v.join(", ")}]`;
      if (v.every(isPair)) {
        const items = v.map((p) => `[${p[0]}, ${p[1]}]`);
        if (items.join(", ").length <= 92) return `[${items.join(", ")}]`;
        const rows = [];
        for (let i = 0; i < items.length; i += perLine) rows.push(items.slice(i, i + perLine).join(", "));
        return `[\n${rows.map((r) => pad(depth + 1) + r).join(",\n")}\n${pad(depth)}]`;
      }
      return `[\n${v.map((x) => pad(depth + 1) + fmt(x, depth + 1)).join(",\n")}\n${pad(depth)}]`;
    }
    const keys = Object.keys(v).filter((k) => v[k] !== undefined);
    if (keys.length === 0) return "{}";
    return `{\n${keys.map((k) => `${pad(depth + 1)}${JSON.stringify(k)}: ${fmt(v[k], depth + 1)}`).join(",\n")}\n${pad(depth)}}`;
  };
  return fmt(value, 0) + "\n";
}
