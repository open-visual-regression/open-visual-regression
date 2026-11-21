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

type Node = { region: Region; parent: Node | null };

const rootOf = (node: Node): Node => {
  let root = node;
  while (root.parent) {
    root = root.parent;
  }
  // Point everything on the way straight at the root, so later lookups are short.
  for (let step = node; step.parent && step.parent !== root; ) {
    const next: Node = step.parent;
    step.parent = root;
    step = next;
  }
  return root;
};

const mergePass = (regions: Region[]): Region[] => {
  const nodes: Node[] = regions.map((region) => ({ region, parent: null }));

  const grid = new Map<string, Node[]>();
  for (const node of nodes) {
    for (const cell of gridCellsOf(node.region)) {
      const others = grid.get(cell);
      if (!others) {
        grid.set(cell, [node]);
        continue;
      }
      for (const other of others) {
        const otherRoot = rootOf(other);
        const nodeRoot = rootOf(node);
        if (
          otherRoot !== nodeRoot &&
          rectsAreNear(other.region.current, node.region.current, MERGE_DISTANCE)
        ) {
          otherRoot.parent = nodeRoot;
        }
      }
      others.push(node);
    }
  }

  const merged = new Map<Node, Region>();
  for (const node of nodes) {
    const root = rootOf(node);
    const existing = merged.get(root);
    merged.set(root, existing ? mergeTwo(existing, node.region) : node.region);
  }
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
