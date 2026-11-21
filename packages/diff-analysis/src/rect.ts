import type { Axis, Rect } from "./types";

/** How many lines a rect holds along an axis: its height in rows, its width in columns. */
export const lineCount = (rect: Rect, axis: Axis): number =>
  axis === "rows" ? rect.height : rect.width;

/** How long each line of a rect is along an axis. */
export const lineLength = (rect: Rect, axis: Axis): number =>
  axis === "rows" ? rect.width : rect.height;

export const otherAxis = (axis: Axis): Axis => (axis === "rows" ? "columns" : "rows");

/** The lines [start, start + count) of a rect along an axis. */
export const sliceRect = (rect: Rect, axis: Axis, start: number, count: number): Rect =>
  axis === "rows"
    ? { x: rect.x, y: rect.y + start, width: rect.width, height: count }
    : { x: rect.x + start, y: rect.y, width: count, height: rect.height };

export const unionRect = (first: Rect, second: Rect): Rect => {
  const x = Math.min(first.x, second.x);
  const y = Math.min(first.y, second.y);
  return {
    x,
    y,
    width: Math.max(first.x + first.width, second.x + second.width) - x,
    height: Math.max(first.y + first.height, second.y + second.height) - y,
  };
};

/** Whether two rects overlap or are at most `distance` pixels apart. */
export const rectsAreNear = (first: Rect, second: Rect, distance: number): boolean =>
  first.x <= second.x + second.width + distance &&
  second.x <= first.x + first.width + distance &&
  first.y <= second.y + second.height + distance &&
  second.y <= first.y + first.height + distance;
