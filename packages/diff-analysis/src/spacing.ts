import type { Alignment } from "./align";
import type { RgbaImage } from "./image";
import { hasMarks, highlightChangesIn, type Highlights } from "./mask";
import { pixelWords } from "./pixels";
import { lineCount, lineLength, mergeNear, overlapsColumns, overlapsRows, unionRect } from "./rect";
import type { Axis, Rect } from "./types";

// A spacing change with highlights this close along most of it is already
// shown by them, like the margin of a new banner, or the gaps between the
// letters of new text.
const NEAR = 8;

// A block of content longer than this right after a spacing change isn't one
// element that moved, like when card backgrounds run on with no blank row
// between them, so it isn't highlighted.
const MAX_MOVED_BLOCK_LENGTH = 400;

// Slivers of one spacing change, split between letters, lie this close together.
const SLIVER_GAP = 8;

// Spacing changes narrower than this between rows, or shorter between columns,
// are slivers between letters that happened to line up, not layout.
const MIN_SPAN: Record<Axis, number> = { rows: 32, columns: 4 };

// How many blank lines in a row end a block of content: any blank row between
// lines of text, but only a gap wider than the ones between letters of a word.
const BLOCK_GAP: Record<Axis, number> = { rows: 1, columns: 8 };

/** Where only blank space was added or removed, along the lines of `axis`. */
type SpaceChange = {
  axis: Axis;
  /** A zero-thickness line in the current image where the content after the change starts. */
  line: Rect;
  /** The lines added, in the current image, or the line where removed ones went. */
  space: Rect;
  /** What a blank line looks like there, one pixel per pixel of `line`. */
  blankLine: Uint32Array;
  /** For removed space, how many lines went, and whether inside a band that changed. */
  removed: { lines: number; nested: boolean } | null;
};

/** Where pixel `offset` of the line at `position` along an axis sits in the image. */
const pixelIndex = (image: RgbaImage, axis: Axis, position: number, from: number, offset: number) =>
  axis === "rows"
    ? position * image.width + from + offset
    : (from + offset) * image.width + position;

/** The pixels of the line at `at` along an axis, across the given span of the other axis. */
const lineOf = (image: RgbaImage, axis: Axis, at: number, from: number, length: number) => {
  const words = pixelWords(image);
  const line = new Uint32Array(length);
  for (let offset = 0; offset < length; offset++) {
    line[offset] = words[pixelIndex(image, axis, at, from, offset)] ?? 0;
  }
  return line;
};

/** Where a line starts along an axis, and where it spans across it. */
const placeOf = (axis: Axis, { x, y, width, height }: Rect) =>
  axis === "rows" ? { at: y, from: x, length: width } : { at: x, from: y, length: height };

/** Joins the slivers of one spacing change, keeping each one's blank line. */
const joinSlivers = (changes: SpaceChange[], current: RgbaImage): SpaceChange[] =>
  mergeNear(
    changes,
    (change) => change.line,
    (first, second) => {
      // The joined line starts where the first of its slivers does.
      const union = unionRect(first.line, second.line);
      const line = first.axis === "rows" ? { ...union, height: 0 } : { ...union, width: 0 };
      const { at, from, length } = placeOf(first.axis, line);
      // The parts between slivers take the current image's line just before the change.
      const blankLine = lineOf(current, first.axis, Math.max(at - 1, 0), from, length);
      for (const part of [first, second]) {
        blankLine.set(part.blankLine, placeOf(part.axis, part.line).from - from);
      }
      const removed =
        first.removed && second.removed
          ? {
              lines: Math.max(first.removed.lines, second.removed.lines),
              nested: first.removed.nested,
            }
          : null;
      return {
        axis: first.axis,
        line,
        space: unionRect(first.space, second.space),
        blankLine,
        removed,
      };
    },
    SLIVER_GAP,
    // Slivers lie side by side along the change, though the content above
    // each, like the letters of a word, can leave them a few lines apart.
    (first, second) =>
      first.axis === second.axis &&
      first.removed?.nested === second.removed?.nested &&
      (placeOf(first.axis, first.line).at === placeOf(second.axis, second.line).at ||
        (first.axis === "rows"
          ? !overlapsColumns(first.line, second.line)
          : !overlapsRows(first.line, second.line))),
  );

/**
 * The first block of content from a change on: from the first line that isn't
 * blank until enough blank lines in a row. A row is blank when it looks like a
 * blank row there, rather than one background color, which keeps the borders
 * of a surrounding card blank. A column is blank when it's the same as the one
 * before it, since across a row of rounded badges or buttons no one column
 * looks like the gaps of all of them. Also returns the blank lines from the
 * change up to the block, which hold the part that grew when the lines added
 * were inside a filled shape, like a bar that got taller.
 */
const firstContent = (
  image: RgbaImage,
  { axis, line, blankLine }: SpaceChange,
): { block: Rect; lead: Rect } => {
  const words = pixelWords(image);
  const { at, from, length } = placeOf(axis, line);
  const end = axis === "rows" ? image.height : image.width;
  const sameAsBefore = (position: number) => {
    const previous = Math.max(position - 1, 0);
    for (let offset = 0; offset < length; offset++) {
      if (
        words[pixelIndex(image, axis, position, from, offset)] !==
        words[pixelIndex(image, axis, previous, from, offset)]
      ) {
        return false;
      }
    }
    return true;
  };
  const isBlank = (position: number) => {
    if (axis === "columns") {
      return sameAsBefore(position);
    }
    for (let offset = 0; offset < length; offset++) {
      if (words[pixelIndex(image, axis, position, from, offset)] !== blankLine[offset]) {
        return false;
      }
    }
    return true;
  };
  let start = at;
  while (start < end && isBlank(start)) {
    start++;
  }
  let stop = start;
  let blankRun = 0;
  for (let position = start; position < end && blankRun < BLOCK_GAP[axis]; position++) {
    if (isBlank(position)) {
      blankRun++;
    } else {
      blankRun = 0;
      stop = position + 1;
    }
  }
  const span = (first: number, last: number) =>
    axis === "rows"
      ? { ...line, y: first, height: last - first }
      : { ...line, x: first, width: last - first };
  return { block: span(start, stop), lead: span(at, start) };
};

/** Whether every line of a rect along an axis is the same, as in blank space that grew. */
const linesAreAlike = (image: RgbaImage, rect: Rect, axis: Axis): boolean => {
  const words = pixelWords(image);
  const { at, from, length } = placeOf(axis, rect);
  for (let position = at + 1; position < at + lineCount(rect, axis); position++) {
    for (let offset = 0; offset < length; offset++) {
      if (
        words[pixelIndex(image, axis, position, from, offset)] !==
        words[pixelIndex(image, axis, at, from, offset)]
      ) {
        return false;
      }
    }
  }
  return true;
};

/** Whether highlights within `NEAR` of a spacing change run along at least half of it. */
const isShownAlready = ({ width, height, mask }: Highlights, { axis, line }: SpaceChange) => {
  const { at, from, length } = placeOf(axis, line);
  const end = axis === "rows" ? height : width;
  let covered = 0;
  for (let offset = -NEAR; offset < length + NEAR; offset++) {
    const across = from + offset;
    if (across < 0 || across >= (axis === "rows" ? width : height)) {
      continue;
    }
    for (let position = Math.max(at - NEAR, 0); position < Math.min(at + NEAR, end); position++) {
      const pixel = axis === "rows" ? position * width + across : across * width + position;
      if (mask[pixel]) {
        covered++;
        break;
      }
    }
  }
  return covered * 2 >= length;
};

/** Whether `before` comes before `line` along an axis and shares part of its span across it. */
const isBefore = (axis: Axis, before: Rect, line: Rect) =>
  axis === "rows"
    ? before.y <= line.y && overlapsColumns(before, line)
    : before.x <= line.x && overlapsRows(before, line);

/**
 * Where only blank space was added or removed, like a margin or padding that
 * changed, the content after it moved because of it, so the first block of it
 * is highlighted as the change, wherever it differs in place. That holds along
 * rows and columns and inside bands that changed, so every change of spacing
 * the alignment finds shows up, except when:
 * - a highlight right next to it already shows it;
 * - it's blank space that went to make room for at least as much content added
 *   before it, so the box around them kept its size;
 * - it's rows settling below a bigger change that ends further up in the same
 *   columns, like a row that got shorter when its tallest item was removed.
 */
export const highlightSpacingChanges = (
  highlights: Highlights,
  baseline: RgbaImage,
  current: RgbaImage,
  {
    insertions,
    deletions,
    removedSpace,
  }: Pick<Alignment, "insertions" | "deletions" | "removedSpace">,
): void => {
  const { width, height, mask, plain } = highlights;
  const spaceAdded = insertions
    .filter(
      ({ rect, axis }) =>
        !hasMarks(mask, width, height, rect) && linesAreAlike(current, rect, axis),
    )
    .map(({ rect, axis }): SpaceChange => {
      const { at, from, length } = placeOf(axis, rect);
      const after = at + lineCount(rect, axis);
      return {
        axis,
        line: axis === "rows" ? { ...rect, y: after, height: 0 } : { ...rect, x: after, width: 0 },
        space: rect,
        blankLine: lineOf(current, axis, at, from, length),
        removed: null,
      };
    });
  const spaceRemoved = removedSpace.map(
    ({ current: line, baseline: space, nested }): SpaceChange => {
      const axis: Axis = line.height === 0 ? "rows" : "columns";
      const { at, from, length } = placeOf(axis, space);
      return {
        axis,
        line,
        space: line,
        blankLine: lineOf(baseline, axis, at, from, length),
        removed: { lines: lineCount(space, axis), nested },
      };
    },
  );

  const contentAdded = insertions.filter(({ rect }) => hasMarks(mask, width, height, rect));
  const madeRoom = ({ axis, line, removed }: SpaceChange) =>
    removed !== null &&
    contentAdded.some(
      (insertion) =>
        insertion.axis === axis &&
        insertion.nested === removed.nested &&
        lineCount(insertion.rect, axis) >= removed.lines &&
        isBefore(axis, insertion.rect, line),
    );

  // Rows that something above added or removed, which everything below moves
  // up or down with, and the rows around it settle by up to as much again.
  const rowShifts = [
    ...contentAdded
      .filter(({ axis }) => axis === "rows")
      .map(({ rect }) => ({ rect, lines: rect.height })),
    ...deletions
      .filter(({ current: at }) => at.height === 0)
      .map(({ current: at, baseline: content }) => ({ rect: at, lines: content.height })),
  ];
  const sizeOf = ({ axis, space, removed }: SpaceChange) =>
    removed?.lines ?? lineCount(space, axis);
  const settlesBelow = (change: SpaceChange) =>
    change.axis === "rows" &&
    rowShifts.some(
      ({ rect, lines }) =>
        lines > sizeOf(change) &&
        rect.y + rect.height <= change.line.y &&
        overlapsColumns(rect, change.line),
    );

  const changes = joinSlivers([...spaceAdded, ...spaceRemoved], current)
    .filter(({ axis, line }) => lineLength(line, axis) >= MIN_SPAN[axis])
    .sort((first, second) => first.line.y - second.line.y || first.line.x - second.line.x);
  for (const change of changes) {
    const { line } = change;
    if (isShownAlready(highlights, change) || madeRoom(change) || settlesBelow(change)) {
      continue;
    }
    if (change.axis === "rows") {
      rowShifts.push({ rect: line, lines: sizeOf(change) });
    }
    // Blank space that only moved looks the same in both images, so the lead
    // up to the next content only shows anything where a filled shape grew.
    const { block, lead } = firstContent(current, change);
    highlightChangesIn(highlights, lead);
    const length = change.axis === "rows" ? block.height : block.width;
    if (length <= MAX_MOVED_BLOCK_LENGTH && hasMarks(plain, width, height, block)) {
      highlightChangesIn(highlights, block);
    } else {
      // With no one element after it, what changed where the space was added
      // shows it instead, like the part of a bar that got taller.
      highlightChangesIn(highlights, change.space);
    }
  }
};
