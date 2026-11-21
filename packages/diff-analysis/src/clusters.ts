import type { Rect } from "./types";

// In pixels. Changes about this close together join one cluster, so a word's letters group together.
const CELL = 8;

/**
 * The bounds of each cluster of set pixels in a mask. Pixels are bucketed into
 * 8×8 cells, and cells that touch, diagonals included, form one cluster.
 */
export const clustersOf = (mask: Uint8Array, width: number, height: number): Rect[] => {
  const cellsAcross = Math.ceil(width / CELL);
  const cellsDown = Math.ceil(height / CELL);
  const cellCount = cellsAcross * cellsDown;
  const minX = new Int32Array(cellCount).fill(width);
  const minY = new Int32Array(cellCount).fill(height);
  const maxX = new Int32Array(cellCount).fill(-1);
  const maxY = new Int32Array(cellCount).fill(-1);
  const occupied = new Uint8Array(cellCount);

  for (let y = 0; y < height; y++) {
    const cellRow = Math.floor(y / CELL) * cellsAcross;
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (!mask[index]) {
        continue;
      }
      const cell = cellRow + Math.floor(x / CELL);
      minX[cell] = Math.min(minX[cell] ?? width, x);
      minY[cell] = Math.min(minY[cell] ?? height, y);
      maxX[cell] = Math.max(maxX[cell] ?? -1, x);
      maxY[cell] = Math.max(maxY[cell] ?? -1, y);
      occupied[cell] = 1;
    }
  }

  const visited = new Uint8Array(cellCount);
  const stack = new Int32Array(cellCount);
  const clusters: Rect[] = [];
  for (let start = 0; start < cellCount; start++) {
    if (visited[start] || !occupied[start]) {
      continue;
    }
    visited[start] = 1;
    let top = 0;
    stack[top++] = start;
    let left = width;
    let upper = height;
    let right = -1;
    let lower = -1;
    while (top > 0) {
      const cell = stack[--top] ?? 0;
      left = Math.min(left, minX[cell] ?? width);
      upper = Math.min(upper, minY[cell] ?? height);
      right = Math.max(right, maxX[cell] ?? -1);
      lower = Math.max(lower, maxY[cell] ?? -1);
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
            occupied[next]
          ) {
            visited[next] = 1;
            stack[top++] = next;
          }
        }
      }
    }
    clusters.push({ x: left, y: upper, width: right - left + 1, height: lower - upper + 1 });
  }
  return clusters;
};
