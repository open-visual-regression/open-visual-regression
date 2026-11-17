import pixelmatch from "pixelmatch";

import { cropPixels, dominantColor, pixelAt } from "./pixels";
import { lineCount, unionRect } from "./rect";
import type { Axis, Image, Mask, Rect } from "./types";

/** pixelmatch's colour threshold; the same value the rest of OVR compares with. */
export const PIXEL_THRESHOLD = 0.1;

const CLUSTER_CELL = 8;

export type NeighbourSide = "before" | "after" | "both";

/** Runs pixelmatch on two RGBA buffers of `rect`'s size and returns the changed pixels. */
const matchPixels = (rect: Rect, before: Uint8Array, after: Uint8Array): Mask => {
  const output = new Uint8Array(before.length);
  pixelmatch(before, after, output, rect.width, rect.height, {
    threshold: PIXEL_THRESHOLD,
    diffMask: true,
    diffColor: [255, 0, 0],
  });
  // With diffMask, changed pixels are drawn red and anti-aliased ones yellow.
  const bits = new Uint8Array(rect.width * rect.height);
  for (let index = 0; index < bits.length; index++) {
    bits[index] = output[index * 4 + 3] !== 0 && output[index * 4 + 1] === 0 ? 1 : 0;
  }
  return { rect, bits };
};

/** Pixels that differ between two same-size rects, placed on the current rect. */
export const compareRects = (
  baseline: Image,
  baselineRect: Rect,
  current: Image,
  currentRect: Rect,
): Mask =>
  matchPixels(currentRect, cropPixels(baseline, baselineRect), cropPixels(current, currentRect));

/** A rect-sized buffer repeating one line of the image across the whole rect. */
const repeatLine = (image: Image, rect: Rect, axis: Axis, line: number): Uint8Array => {
  const out = new Uint8Array(rect.width * rect.height * 4);
  if (axis === "rows") {
    const source = cropPixels(image, { ...rect, y: line, height: 1 });
    for (let row = 0; row < rect.height; row++) {
      out.set(source, row * source.length);
    }
    return out;
  }
  const words = new Uint32Array(out.buffer);
  for (let row = 0; row < rect.height; row++) {
    words.fill(pixelAt(image, line, rect.y + row), row * rect.width, (row + 1) * rect.width);
  }
  return out;
};

/**
 * The pixels of an inserted or deleted slice that are content rather than
 * stretched background. The slice is compared with the line just outside it
 * repeated across the slice, so blank space that grew, a border that got
 * longer or a background that got wider count as nothing. At the edge of the
 * image, it is compared with the page's most common colour instead.
 *
 * `side` limits which neighbour may be used, for slices that sit next to
 * other changed content on one side.
 */
export const inkOf = (image: Image, rect: Rect, axis: Axis, side: NeighbourSide = "both"): Mask => {
  const start = axis === "rows" ? rect.y : rect.x;
  const end = start + lineCount(rect, axis);
  const limit = axis === "rows" ? image.height : image.width;
  const candidates = { before: [start - 1], after: [end], both: [start - 1, end] }[side];
  const neighbours = candidates.filter((line) => line >= 0 && line < limit);
  const content = cropPixels(image, rect);

  if (neighbours.length === 0) {
    // Past the edge of the image, assume the page background continues.
    const background = dominantColor(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
    const fill = new Uint8Array(content.length);
    new Uint32Array(fill.buffer).fill(background);
    return matchPixels(rect, fill, content);
  }

  return neighbours
    .map((line) => matchPixels(rect, repeatLine(image, rect, axis, line), content))
    .reduce((best, mask) => (countBits(mask) < countBits(best) ? mask : best));
};

export const countBits = (mask: Mask): number => {
  let count = 0;
  for (const bit of mask.bits) {
    count += bit;
  }
  return count;
};

/** The tightest rect around a mask's set pixels, or null when none are set. */
export const boundingBox = (mask: Mask): Rect | null =>
  // One cell covering the whole mask makes everything one cluster.
  clustersOf(mask, Math.max(mask.rect.width, mask.rect.height, 1))[0] ?? null;

/**
 * Groups a mask's set pixels into clusters. Pixels are bucketed into square
 * cells of `cellSize`; touching cells, diagonals included, form one cluster.
 * Returns each cluster's exact pixel bounds in image coordinates.
 */
export const clustersOf = (mask: Mask, cellSize = CLUSTER_CELL): Rect[] => {
  const { rect, bits } = mask;
  const cellsAcross = Math.ceil(rect.width / cellSize);
  const cellsDown = Math.ceil(rect.height / cellSize);
  const cellBounds = new Map<number, Rect>();

  for (let row = 0; row < rect.height; row++) {
    for (let column = 0; column < rect.width; column++) {
      if (bits[row * rect.width + column]) {
        const cell = Math.floor(row / cellSize) * cellsAcross + Math.floor(column / cellSize);
        const pixel = { x: column, y: row, width: 1, height: 1 };
        const bounds = cellBounds.get(cell);
        cellBounds.set(cell, bounds ? unionRect(bounds, pixel) : pixel);
      }
    }
  }

  const neighbours = (cell: number): number[] => {
    const cellX = cell % cellsAcross;
    const cellY = Math.floor(cell / cellsAcross);
    return [-1, 0, 1]
      .flatMap((dy) => [-1, 0, 1].map((dx) => [cellX + dx, cellY + dy] as const))
      .filter(([x, y]) => x >= 0 && y >= 0 && x < cellsAcross && y < cellsDown)
      .map(([x, y]) => y * cellsAcross + x);
  };

  const visited = new Set<number>();
  const clusters: Rect[] = [];
  for (const start of cellBounds.keys()) {
    if (visited.has(start)) {
      continue;
    }
    visited.add(start);
    const queue = [start];
    let bounds = cellBounds.get(start)!;
    while (queue.length > 0) {
      const cell = queue.pop()!;
      bounds = unionRect(bounds, cellBounds.get(cell)!);
      for (const next of neighbours(cell)) {
        if (cellBounds.has(next) && !visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
    clusters.push({ ...bounds, x: rect.x + bounds.x, y: rect.y + bounds.y });
  }
  return clusters;
};

/** Paints masks onto one full-size mask of an image `width` × `height`. */
export const paintMasks = (masks: Mask[], width: number, height: number): Uint8Array => {
  const canvas = new Uint8Array(width * height);
  for (const { rect, bits } of masks) {
    for (let row = 0; row < rect.height; row++) {
      for (let column = 0; column < rect.width; column++) {
        if (bits[row * rect.width + column]) {
          canvas[(rect.y + row) * width + rect.x + column] = 1;
        }
      }
    }
  }
  return canvas;
};
