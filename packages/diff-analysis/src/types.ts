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

export type RegionKind = "changed" | "inserted" | "deleted" | "moved";

/**
 * One visual change. `current` is where it sits in the current image and
 * `baseline` where it sits in the baseline image. A deletion has no extent in
 * the current image, so its `current` rect is a line of zero height or width.
 * A move is content that is unchanged but now sits somewhere else.
 */
export type Region = RectPair & {
  kind: RegionKind;
};
