export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** The direction lines run in: "rows" are horizontal lines, "columns" vertical ones. */
export type Axis = "rows" | "columns";

/** A baseline rect and the current rect it is compared with. */
export type RectPair = {
  baseline: Rect;
  current: Rect;
};

/** One byte per pixel of an image: 1 where a diff marks it. */
export type DiffMask = {
  width: number;
  height: number;
  mask: Uint8Array;
};

/**
 * What changed between two screenshots, marked on each of them like a code
 * diff: on the baseline, what was removed or changed, and on the current
 * image, what was added or changed.
 */
export type TwoSidedDiff = {
  baseline: DiffMask;
  current: DiffMask;
  /** Pixels a plain position-by-position pixelmatch counts as changed. */
  plainChangedPixelCount: number;
};
