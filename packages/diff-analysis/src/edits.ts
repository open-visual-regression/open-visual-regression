import { type Alignment } from "./align";
import type { RgbaImage } from "./image";
import { pixelWords } from "./pixels";
import { lineCount, lineLength, mergeNear, unionRect } from "./rect";
import type { Axis, DiffMask, Rect } from "./types";

// Marks the lines an alignment found added or removed: content where it is,
// and blank space, like a margin that changed, where there's content beside
// it. Every distance and size threshold is in screenshot pixels.

// Space added or removed in bands narrower than this between rows, or shorter
// between columns, is a sliver between letters that happened to line up, not
// layout. Changes in content that close by are marked anyway.
const MIN_SPACE_SPAN: Record<Axis, number> = { rows: 32, columns: 4 };

// Blank space a single line thick is a row or column of content settling by a
// pixel, like items re-centered in a row a little taller, not spacing anyone changed.
const MIN_SPACE_LINES = 2;

// Content added or removed accounts for blank space up to this much bigger
// than its own size, which leaves out its margins.
const KEPT_SIZE_SHARE = 0.75;

// How far past blank space that changed to look for the content it sits
// next to, which its tint is kept to.
const SPACE_REACH = 16;

// Slivers of one change of spacing, split up by the letters or icons above or
// beside them, lie this close together.
const SLIVER_GAP = 8;

// Space with content this close on both sides along its axis is inside one
// element, like padding, rather than between two.
const ELEMENT_GAP = 8;

// An element longer than this around space that changed is a whole region,
// not one element, so only the space is tinted.
const MAX_ELEMENT_LENGTH = 400;

/** Marks every pixel of a rect, clipped to the mask. */
const markRect = ({ width, height, mask }: DiffMask, { x, y, width: w, height: h }: Rect) => {
  const right = Math.min(x + w, width);
  const bottom = Math.min(y + h, height);
  for (let row = Math.max(y, 0); row < bottom; row++) {
    mask.fill(1, row * width + Math.max(x, 0), row * width + right);
  }
};

/** Whether a gap or a line between rows or columns is wide enough to be layout. */
const isLayout = (rect: Rect, axis: Axis) => lineLength(rect, axis) >= MIN_SPACE_SPAN[axis];

/** The axis a zero-width or zero-height line in the current image runs across. */
const axisOf = (line: Rect): Axis => (line.height === 0 ? "rows" : "columns");

/**
 * Whether everything from a rect to the far edge of the current image along an
 * axis, within the rect's span, is blank. Space changed there only pads the
 * page out to its height, or a row out to its width, so it isn't a change
 * anyone made.
 */
const padsToEnd = (image: RgbaImage, rect: Rect, axis: Axis) => {
  const words = pixelWords(image);
  const start = axis === "rows" ? rect.y : rect.x;
  const end = axis === "rows" ? image.height : image.width;
  const across = axis === "rows" ? rect.width : rect.height;
  const at = (line: number, offset: number) =>
    axis === "rows"
      ? words[line * image.width + rect.x + offset]
      : words[(rect.y + offset) * image.width + line];
  for (let line = start + 1; line < end; line++) {
    for (let offset = 0; offset < across; offset++) {
      if (at(line, offset) !== at(start, offset)) {
        return false;
      }
    }
  }
  return true;
};

/** Whether any pixel of a rect is marked. */
const hasMarks = ({ width, height, mask }: DiffMask, { x, y, width: w, height: h }: Rect) => {
  const right = Math.min(x + w, width);
  const bottom = Math.min(y + h, height);
  for (let row = Math.max(y, 0); row < bottom; row++) {
    for (let column = Math.max(x, 0); column < right; column++) {
      if (mask[row * width + column]) {
        return true;
      }
    }
  }
  return false;
};

/**
 * The part of a rect of lines added or removed worth tinting: the lines across
 * it, rows for lines between columns and columns for lines between rows, where
 * there's content within reach, either in the lines themselves or beside
 * them. That keeps a badge whose padding grew to the height of the badge,
 * not the whole band it sits in. Null when there's no content near at all.
 */
const contentSpan = (image: RgbaImage, rect: Rect, axis: Axis): Rect | null => {
  const words = pixelWords(image);
  const across = axis === "rows" ? rect.width : rect.height;
  const along = axis === "rows" ? rect.height : rect.width;
  const start = axis === "rows" ? rect.y : rect.x;
  const end = axis === "rows" ? image.height : image.width;
  const at = (line: number, offset: number) =>
    axis === "rows"
      ? (words[line * image.width + rect.x + offset] ?? 0)
      : (words[(rect.y + offset) * image.width + line] ?? 0);
  let first = -1;
  let last = -1;
  for (let offset = 0; offset < across; offset++) {
    // What the background looks like there: the line just before the rect, or
    // its first line when it starts at the edge.
    const blank = at(start > 0 ? start - 1 : start, offset);
    let content = false;
    for (let line = start - SPACE_REACH; line < start + along + SPACE_REACH && !content; line++) {
      content = line >= 0 && line < end && at(line, offset) !== blank;
    }
    if (content) {
      first = first < 0 ? offset : first;
      last = offset;
    }
  }
  if (first < 0) {
    return null;
  }
  return axis === "rows"
    ? { ...rect, x: rect.x + first, width: last - first + 1 }
    : { ...rect, y: rect.y + first, height: last - first + 1 };
};

/** Whether `before` starts no later than `rect` along an axis and shares part of its span across it. */
const isBefore = (axis: Axis, before: Rect, rect: Rect) =>
  axis === "rows"
    ? before.y <= rect.y &&
      before.x < rect.x + Math.max(rect.width, 1) &&
      rect.x < before.x + Math.max(before.width, 1)
    : before.x <= rect.x &&
      before.y < rect.y + Math.max(rect.height, 1) &&
      rect.y < before.y + Math.max(before.height, 1);

/** A change in content the alignment found: where it is, along which axis, and how many lines. */
type ContentChange = { at: Rect; axis: Axis; lines: number };

/**
 * Blank space added or removed along an axis: where it is in the current image,
 * where to tint it, in the current image for space added and the baseline for
 * space removed, and how many lines it spans.
 */
type SpaceEdit = { axis: Axis; at: Rect; tint: Rect; lines: number };

/** Joins the slivers of each change of spacing into one. */
const joinSpaceEdits = (edits: SpaceEdit[]): SpaceEdit[] =>
  mergeNear(
    edits,
    (edit) => edit.at,
    (first, second) => ({
      axis: first.axis,
      at: unionRect(first.at, second.at),
      tint: unionRect(first.tint, second.tint),
      lines: Math.max(first.lines, second.lines),
    }),
    SLIVER_GAP,
    (first, second) => first.axis === second.axis,
  );

/**
 * The element blank space sits inside, along its axis: out from the space on
 * both sides until a gap of `ELEMENT_GAP` lines that are each the same as the
 * one before, within the span across it. Null when the space is a gap between
 * elements rather than inside one: one color all the way across, or without
 * content right up against it on both sides.
 */
const elementAround = (image: RgbaImage, span: Rect, axis: Axis): Rect | null => {
  const words = pixelWords(image);
  const start = axis === "rows" ? span.y : span.x;
  const along = axis === "rows" ? span.height : span.width;
  const end = axis === "rows" ? image.height : image.width;
  const across = axis === "rows" ? span.width : span.height;
  const at = (line: number, offset: number) =>
    axis === "rows"
      ? words[line * image.width + span.x + offset]
      : words[(span.y + offset) * image.width + line];
  const sameLines = (first: number, second: number) => {
    for (let offset = 0; offset < across; offset++) {
      if (at(first, offset) !== at(second, offset)) {
        return false;
      }
    }
    return true;
  };
  // Stepping out from the space by `step`: the first line that isn't blank,
  // and the last one before a gap.
  const edge = (from: number, step: 1 | -1) => {
    let nearest = -1;
    let last = from;
    let quiet = 0;
    for (
      let line = from + step;
      line >= 0 && line < end && quiet < ELEMENT_GAP && Math.abs(line - from) <= MAX_ELEMENT_LENGTH;
      line += step
    ) {
      if (sameLines(line, line - step)) {
        quiet++;
      } else {
        quiet = 0;
        last = line;
        nearest = nearest < 0 ? line : nearest;
      }
    }
    return { nearest, last };
  };
  // Space inside an element crosses its border or fill, so its lines aren't
  // one color all the way across, where a gap between elements is.
  let uniform = true;
  for (let offset = 1; offset < across && uniform; offset++) {
    uniform = at(start, offset) === at(start, 0);
  }
  if (uniform) {
    return null;
  }
  const before = edge(start, -1);
  const after = edge(start + along - 1, 1);
  const first = before.last;
  const last = after.last;
  if (
    before.nearest < 0 ||
    after.nearest < 0 ||
    start - before.nearest > ELEMENT_GAP ||
    after.nearest - (start + along - 1) > ELEMENT_GAP
  ) {
    return null;
  }
  return axis === "rows"
    ? { ...span, y: first, height: last - first + 1 }
    : { ...span, x: first, width: last - first + 1 };
};

/**
 * Tints blank space where there's content beside it. Space inside an element,
 * like padding that grew, tints the whole element, since that's what changed
 * size.
 */
const markSpace = (mask: DiffMask, image: RgbaImage, rect: Rect, axis: Axis) => {
  const span = contentSpan(image, rect, axis);
  if (span) {
    markRect(mask, elementAround(image, span, axis) ?? span);
  }
};

/**
 * Marks content and blank space an alignment found added on the current image,
 * and removed on the baseline.
 */
export const markEdits = (
  baseline: RgbaImage,
  current: RgbaImage,
  baselineMask: DiffMask,
  currentMask: DiffMask,
  { insertions, deletions, removedSpace }: Alignment,
) => {
  // Inserted content differs from the baseline lines the alignment fills it
  // in with, where inserted blank space doesn't.
  const added = insertions.map((insertion) => ({
    ...insertion,
    isBlank: !hasMarks(currentMask, insertion.rect),
  }));
  const contentAdded: ContentChange[] = added
    .filter(({ isBlank }) => !isBlank)
    .map(({ rect, axis }) => ({ at: rect, axis, lines: lineCount(rect, axis) }));
  const contentRemoved: ContentChange[] = deletions.map(({ current: line, baseline: content }) => {
    const axis = axisOf(line);
    return { at: line, axis, lines: lineCount(content, axis) };
  });
  // Blank space that went to make room for content added before it, or came
  // to fill in for content removed before it, in pieces or at once, keeps the
  // box around them the same size, like the empty end of a card a new line
  // moved into.
  const keepsSize = (changes: ContentChange[], rect: Rect, axis: Axis, lines: number) => {
    let before = 0;
    for (const change of changes) {
      if (change.axis === axis && isBefore(axis, change.at, rect)) {
        before += change.lines;
      }
    }
    // Content is measured without the blank margins around it, so it can
    // account for space a little bigger than itself.
    return before >= lines * KEPT_SIZE_SHARE;
  };

  for (const { rect, axis, isBlank } of added) {
    if (!isBlank && isLayout(rect, axis)) {
      const span = contentSpan(current, rect, axis);
      if (span) {
        markRect(currentMask, span);
      }
    }
  }
  for (const { current: line, baseline: content } of deletions) {
    if (isLayout(line, axisOf(line))) {
      markRect(baselineMask, content);
    }
  }

  const spaceAdded = joinSpaceEdits(
    added
      .filter(({ isBlank }) => isBlank)
      .map(({ rect, axis }) => ({ axis, at: rect, tint: rect, lines: lineCount(rect, axis) })),
  );
  const spaceRemoved = joinSpaceEdits(
    removedSpace.map(({ current: line, baseline: space }) => {
      const axis = axisOf(line);
      return { axis, at: line, tint: space, lines: lineCount(space, axis) };
    }),
  );
  const isLayoutSpace = ({ axis, at, lines }: SpaceEdit) =>
    isLayout(at, axis) && lines >= MIN_SPACE_LINES && !padsToEnd(current, at, axis);
  for (const edit of spaceAdded) {
    if (isLayoutSpace(edit) && !keepsSize(contentRemoved, edit.at, edit.axis, edit.lines)) {
      markSpace(currentMask, current, edit.tint, edit.axis);
    }
  }
  for (const edit of spaceRemoved) {
    if (isLayoutSpace(edit) && !keepsSize(contentAdded, edit.at, edit.axis, edit.lines)) {
      markSpace(baselineMask, baseline, edit.tint, edit.axis);
    }
  }
};
