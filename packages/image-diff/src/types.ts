/** An RGBA bitmap, four bytes per pixel, rows top to bottom. */
export type Image = {
  width: number;
  height: number;
  data: Uint8Array;
};

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

export type RegionKind = "modified" | "inserted" | "deleted";

/**
 * One visual change. `current` is where it sits in the current image and
 * `baseline` where it sits in the baseline image. A deletion has no extent in
 * the current image, so its `current` rect is a line of zero height or width.
 */
export type Region = RectPair & {
  kind: RegionKind;
};

/** Changed pixels of one rect of the current image, one byte per pixel. */
export type Mask = {
  rect: Rect;
  bits: Uint8Array;
};
