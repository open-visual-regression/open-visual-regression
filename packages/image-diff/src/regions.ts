import { rectsAreNear, unionRect } from "./rect";
import type { Region } from "./types";

// Changes closer than this read as one change, like the words of an edited sentence.
const MERGE_DISTANCE = 12;
// Regions are bucketed into a grid this coarse so each is only checked against nearby ones.
const GRID_CELL = 64;

const mergeTwo = (first: Region, second: Region): Region => ({
  kind: first.kind === second.kind ? first.kind : "modified",
  current: unionRect(first.current, second.current),
  baseline: unionRect(first.baseline, second.baseline),
});

const gridCellsOf = (region: Region): string[] => {
  const { x, y, width, height } = region.current;
  const cells: string[] = [];
  for (
    let cy = Math.floor((y - MERGE_DISTANCE) / GRID_CELL);
    cy <= Math.floor((y + height + MERGE_DISTANCE) / GRID_CELL);
    cy++
  ) {
    for (
      let cx = Math.floor((x - MERGE_DISTANCE) / GRID_CELL);
      cx <= Math.floor((x + width + MERGE_DISTANCE) / GRID_CELL);
      cx++
    ) {
      cells.push(`${cx},${cy}`);
    }
  }
  return cells;
};

/** One pass of union-find over nearby regions. */
const mergePass = (regions: Region[]): Region[] => {
  const parent = regions.map((_, index) => index);
  const root = (index: number): number => {
    let node = index;
    while (parent[node] !== node) {
      parent[node] = parent[parent[node]!]!;
      node = parent[node]!;
    }
    return node;
  };

  const grid = new Map<string, number[]>();
  regions.forEach((region, index) => {
    for (const cell of gridCellsOf(region)) {
      const others = grid.get(cell);
      if (!others) {
        grid.set(cell, [index]);
        continue;
      }
      for (const other of others) {
        if (
          root(other) !== root(index) &&
          rectsAreNear(regions[other]!.current, region.current, MERGE_DISTANCE)
        ) {
          parent[root(other)] = root(index);
        }
      }
      others.push(index);
    }
  });

  const merged = new Map<number, Region>();
  regions.forEach((region, index) => {
    const group = root(index);
    const existing = merged.get(group);
    merged.set(group, existing ? mergeTwo(existing, region) : region);
  });
  return [...merged.values()];
};

/**
 * Merges regions that touch or nearly touch. A merged box can grow into a
 * new neighbour, so passes repeat until nothing changes. Sorted top to
 * bottom, then left to right.
 */
export const mergeRegions = (regions: Region[]): Region[] => {
  const merged = mergePass(regions);
  return merged.length === regions.length
    ? merged.sort((a, b) => a.current.y - b.current.y || a.current.x - b.current.x)
    : mergeRegions(merged);
};
