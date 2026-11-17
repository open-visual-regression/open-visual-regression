import type { Axis, Rect } from "./types";

export const isEmptyRect = (rect: Rect): boolean => rect.width === 0 || rect.height === 0;

export const areaOf = (rect: Rect): number => rect.width * rect.height;

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

/** The axis along which an empty rect has no extent. */
export const emptyAxis = (rect: Rect): Axis => (rect.height === 0 ? "rows" : "columns");

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

/** Moves a rect inside `from` to the same relative spot inside `to`. */
export const translateRect = (rect: Rect, from: Rect, to: Rect): Rect => ({
  ...rect,
  x: to.x + rect.x - from.x,
  y: to.y + rect.y - from.y,
});
