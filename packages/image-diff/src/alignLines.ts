import diffSequences from "@jest/diff-sequences";

/** Lines [start, end) of the baseline that line up with lines [start, end) of the current image. */
export type LineSpan = {
  baselineStart: number;
  baselineEnd: number;
  currentStart: number;
  currentEnd: number;
};

export type LineAlignment = {
  /** How many lines matched, at any offset. */
  matchedCount: number;
  /** The runs of lines between matches, in order. Either side may be empty. */
  gaps: LineSpan[];
};

type Match = {
  baselineStart: number;
  currentStart: number;
  length: number;
};

// Myers costs O(lines × edits), which gets slow when two long stretches have
// little in common. Past this many lines, a stretch with no anchors is left
// as one gap instead of being searched.
const MAX_UNANCHORED_LINES = 4000;

/**
 * Pairs up lines that occur exactly once on each side and keeps the longest
 * run of pairs that stays in order (patience sorting, as in `git diff
 * --patience`). These anchors split the problem into small independent stretches.
 */
const uniqueAnchors = (baseline: Float64Array, current: Float64Array): Match[] => {
  const counts = new Map<number, { baseline: number; current: number; at: number; to: number }>();
  for (const [index, line] of baseline.entries()) {
    const entry = counts.get(line);
    if (entry) {
      entry.baseline += 1;
    } else {
      counts.set(line, { baseline: 1, current: 0, at: index, to: -1 });
    }
  }
  for (const [index, line] of current.entries()) {
    const entry = counts.get(line);
    if (entry) {
      entry.current += 1;
      entry.to = index;
    }
  }

  const pairs = [...counts.values()]
    .filter((entry) => entry.baseline === 1 && entry.current === 1)
    .sort((a, b) => a.at - b.at);

  // Longest run of pairs whose `to` keeps increasing, in O(k log k). Each pile
  // keeps its top pair, linked to the top of the pile before it when placed.
  type Pile = { at: number; to: number; below: Pile | null };
  const piles: Pile[] = [];
  for (const pair of pairs) {
    let low = 0;
    let high = piles.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      const pile = piles[middle];
      if (pile && pile.to < pair.to) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    piles[low] = { at: pair.at, to: pair.to, below: piles[low - 1] ?? null };
  }

  const chain: Match[] = [];
  for (let pile = piles.at(-1) ?? null; pile; pile = pile.below) {
    chain.push({ baselineStart: pile.at, currentStart: pile.to, length: 1 });
  }
  return chain.reverse();
};

/** Myers diff of one stretch, unless it can't match anything or would be too slow. */
const diffStretch = (baseline: Float64Array, current: Float64Array): Match[] => {
  if (baseline.length === 0 || current.length === 0) {
    return [];
  }
  const baselineLines = new Set(baseline);
  if (!current.some((line) => baselineLines.has(line))) {
    return [];
  }
  if (baseline.length + current.length > MAX_UNANCHORED_LINES) {
    return [];
  }
  const matches: Match[] = [];
  diffSequences(
    baseline.length,
    current.length,
    (baselineIndex, currentIndex) => baseline[baselineIndex] === current[currentIndex],
    (length, baselineStart, currentStart) => {
      matches.push({ baselineStart, currentStart, length });
    },
  );
  return matches;
};

/** Matches between the anchors, shifted back into whole-list positions. */
const matchAround = (baseline: Float64Array, current: Float64Array, anchors: Match[]): Match[] => {
  const ends = [
    ...anchors,
    { baselineStart: baseline.length, currentStart: current.length, length: 0 },
  ];
  return ends.flatMap((anchor, index) => {
    const before = anchors[index - 1];
    const baselineFrom = before ? before.baselineStart + 1 : 0;
    const currentFrom = before ? before.currentStart + 1 : 0;
    const between = diffStretch(
      baseline.subarray(baselineFrom, anchor.baselineStart),
      current.subarray(currentFrom, anchor.currentStart),
    ).map((match) => ({
      baselineStart: match.baselineStart + baselineFrom,
      currentStart: match.currentStart + currentFrom,
      length: match.length,
    }));
    return anchor.length > 0 ? [...between, anchor] : between;
  });
};

/**
 * Aligns two lists of line hashes so lines that only moved still match, and
 * returns the unmatched gaps between them. Unique lines anchor the alignment
 * and a Myers diff (the algorithm behind `git diff`) fills in between.
 */
export const alignLines = (baseline: Float64Array, current: Float64Array): LineAlignment => {
  const anchors = uniqueAnchors(baseline, current);
  const matches =
    anchors.length > 0 ? matchAround(baseline, current, anchors) : diffStretch(baseline, current);

  // A sentinel match at the end turns "the space before each match" into every gap.
  const ends = [
    ...matches,
    { baselineStart: baseline.length, currentStart: current.length, length: 0 },
  ];
  const gaps = ends
    .map((match, index) => {
      const previous = matches[index - 1];
      return {
        baselineStart: previous ? previous.baselineStart + previous.length : 0,
        baselineEnd: match.baselineStart,
        currentStart: previous ? previous.currentStart + previous.length : 0,
        currentEnd: match.currentStart,
      };
    })
    .filter((gap) => gap.baselineEnd > gap.baselineStart || gap.currentEnd > gap.currentStart);

  return {
    matchedCount: matches.reduce((sum, match) => sum + match.length, 0),
    gaps,
  };
};
