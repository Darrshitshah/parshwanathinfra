/**
 * Helpers shared by the primitives. Owner: motion-lead.
 */
import { gsap } from "gsap";
import type { Targets } from "../types";

const SHAPE_SELECTOR = "path, line, polyline, polygon, rect, circle, ellipse";
const SHAPE_TAGS = new Set(SHAPE_SELECTOR.split(",").map((tag) => tag.trim()));
/** Containers whose shapes are never drawn on screen. */
const NON_RENDERED = "defs, mask, clipPath, symbol, pattern, marker";

export function toElements(targets: Targets): Element[] {
  return gsap.utils.toArray<unknown>(targets).filter((item): item is Element => item instanceof Element);
}

function isShape(element: Element): element is SVGGeometryElement {
  return SHAPE_TAGS.has(element.tagName.toLowerCase());
}

function isSkipped(element: Element): boolean {
  return element.closest("[data-ink-skip]") !== null || element.closest(NON_RENDERED) !== null;
}

/**
 * The stroked shapes inside the targets. A target may itself be a shape, or a group / svg / wrapper that holds
 * shapes. Shapes inside <defs>, masks and clip paths, or marked `data-ink-skip`, are left alone.
 */
export function drawableShapes(targets: Targets): SVGGeometryElement[] {
  const shapes: SVGGeometryElement[] = [];
  for (const element of toElements(targets)) {
    if (isShape(element)) {
      if (!isSkipped(element)) shapes.push(element);
      continue;
    }
    element.querySelectorAll<SVGGeometryElement>(SHAPE_SELECTOR).forEach((shape) => {
      if (!isSkipped(shape)) shapes.push(shape);
    });
  }
  return shapes;
}

export function isHtmlElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

/** The items that exist: drops nulls and undefined, so optional parts can be passed to GSAP as one list. */
export function present<T>(...items: (T | null | undefined)[]): T[] {
  return items.filter((item): item is T => item !== null && item !== undefined);
}
