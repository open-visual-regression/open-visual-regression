import type { AlignedDiff } from "./alignedDiff";
import type { RgbaImage } from "./image";
import type { Rect } from "./types";

// Translucent, so the changed content stays readable under it.
const TINT = [255, 40, 40, 80];
// Changed pixels in touching cells this size form one area, so the letters of
// a word, or the old and new spots of something that moved a little, read as one.
const CELL = 4;
// Space left around each area, so its edges don't sit right on the content.
const PADDING = 3;

/** The bounds of each group of changed pixels that lie close together. */
const changedAreas = (mask: Uint8Array, width: number, height: number): Rect[] => {
  const cellsAcross = Math.ceil(width / CELL);
  const cellsDown = Math.ceil(height / CELL);
  const cellCount = cellsAcross * cellsDown;
  const left = new Int32Array(cellCount).fill(width);
  const top = new Int32Array(cellCount).fill(height);
  const right = new Int32Array(cellCount).fill(-1);
  const bottom = new Int32Array(cellCount).fill(-1);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y * width + x]) {
        continue;
      }
      const cell = Math.floor(y / CELL) * cellsAcross + Math.floor(x / CELL);
      left[cell] = Math.min(left[cell] ?? width, x);
      top[cell] = Math.min(top[cell] ?? height, y);
      right[cell] = Math.max(right[cell] ?? -1, x);
      bottom[cell] = Math.max(bottom[cell] ?? -1, y);
    }
  }

  const visited = new Uint8Array(cellCount);
  const stack = new Int32Array(cellCount);
  const areas: Rect[] = [];
  for (let start = 0; start < cellCount; start++) {
    if (visited[start] || (right[start] ?? -1) < 0) {
      continue;
    }
    visited[start] = 1;
    stack[0] = start;
    let size = 1;
    const bounds = { left: width, top: height, right: -1, bottom: -1 };
    while (size > 0) {
      const cell = stack[--size] ?? 0;
      bounds.left = Math.min(bounds.left, left[cell] ?? width);
      bounds.top = Math.min(bounds.top, top[cell] ?? height);
      bounds.right = Math.max(bounds.right, right[cell] ?? -1);
      bounds.bottom = Math.max(bounds.bottom, bottom[cell] ?? -1);
      const cellX = cell % cellsAcross;
      const cellY = Math.floor(cell / cellsAcross);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = cellX + dx;
          const y = cellY + dy;
          const next = y * cellsAcross + x;
          if (
            x >= 0 &&
            y >= 0 &&
            x < cellsAcross &&
            y < cellsDown &&
            !visited[next] &&
            (right[next] ?? -1) >= 0
          ) {
            visited[next] = 1;
            stack[size++] = next;
          }
        }
      }
    }
    areas.push({
      x: bounds.left,
      y: bounds.top,
      width: bounds.right - bounds.left + 1,
      height: bounds.bottom - bounds.top + 1,
    });
  }
  return areas;
};

/** Draws a diff as a transparent overlay for the current image, tinting each area that changed. */
export const renderDiff = (diff: AlignedDiff): RgbaImage => {
  const { width, height } = diff;
  const data = new Uint8Array(width * height * 4);
  for (const area of changedAreas(diff.mask, width, height)) {
    const right = Math.min(area.x + area.width + PADDING, width);
    const bottom = Math.min(area.y + area.height + PADDING, height);
    for (let y = Math.max(area.y - PADDING, 0); y < bottom; y++) {
      for (let x = Math.max(area.x - PADDING, 0); x < right; x++) {
        data.set(TINT, (y * width + x) * 4);
      }
    }
  }
  return { width, height, data };
};
