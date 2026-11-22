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
