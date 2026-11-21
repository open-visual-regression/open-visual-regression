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

// A stretch with no anchors that is still longer than this, even collapsed,
// is left as one gap instead of being searched.
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

// Myers needs at least one edit per line that can't match, and costs about
// lines × edits. Past this many steps, runs of those lines are collapsed.
const MAX_EXACT_STEPS = 1 << 18;

type Sequence = { lines: ArrayLike<number>; positions: number[] | null };

/**
 * Collapses every run of lines that can't match anything on the other side
 * into one placeholder. NaN never equals anything, so the placeholders keep
 * the stretch's shape without ever matching.
 */
const collapse = (lines: Float64Array, other: Set<number>): Sequence => {
  const collapsed: number[] = [];
  const positions: number[] = [];
  for (const [index, line] of lines.entries()) {
    const shared = other.has(line);
    if (shared || !Number.isNaN(collapsed.at(-1))) {
      collapsed.push(shared ? line : Number.NaN);
      positions.push(index);
    }
  }
  return { lines: collapsed, positions };
};

const countUnshared = (lines: Float64Array, other: Set<number>) => {
  let count = 0;
  for (const line of lines) {
    count += other.has(line) ? 0 : 1;
  }
  return count;
};

/**
 * Myers diff of one stretch. When most lines changed, which makes Myers slow,
 * runs of lines that can't match are collapsed first, much like `git diff`
 * discards them. Collapsed runs weigh less, so this only kicks in when exact
 * would be slow.
 */
const diffStretch = (baseline: Float64Array, current: Float64Array): Match[] => {
  const total = baseline.length + current.length;
  const baselineSet = new Set(baseline);
  const currentSet = new Set(current);
  const unshared = countUnshared(baseline, currentSet) + countUnshared(current, baselineSet);
  if (baseline.length === 0 || current.length === 0 || unshared === total) {
    return [];
  }
  const exact = unshared * total <= MAX_EXACT_STEPS;
  const before: Sequence = exact
    ? { lines: baseline, positions: null }
    : collapse(baseline, currentSet);
  const after: Sequence = exact
    ? { lines: current, positions: null }
    : collapse(current, baselineSet);
  if (before.lines.length + after.lines.length > MAX_UNANCHORED_LINES) {
    return [];
  }
  const matches: Match[] = [];
  diffSequences(
    before.lines.length,
    after.lines.length,
    (baselineIndex, currentIndex) => before.lines[baselineIndex] === after.lines[currentIndex],
    // Matched lines are never placeholders, so a run maps back to a run.
    (length, baselineStart, currentStart) => {
      matches.push({
        baselineStart: before.positions?.[baselineStart] ?? baselineStart,
        currentStart: after.positions?.[currentStart] ?? currentStart,
        length,
      });
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
 * Lines inserted into, or removed from, a run of identical lines (blank space,
 * say) could sit anywhere in that run. Each one-sided gap is slid to the end
 * of its run, as `git diff` does, so space that grew shows up where it was
 * added, like the edge of a sidebar that got wider.
 */
const slideGaps = (gaps: LineSpan[], baseline: Float64Array, current: Float64Array): LineSpan[] =>
  gaps.map((gap, index) => {
    const inserted = gap.baselineStart === gap.baselineEnd;
    if (!inserted && gap.currentStart !== gap.currentEnd) {
      return gap;
    }
    const next = gaps[index + 1];
    const baselineLimit = next ? next.baselineStart : baseline.length;
    const currentLimit = next ? next.currentStart : current.length;
    const lines = inserted ? current : baseline;
    const start = inserted ? gap.currentStart : gap.baselineStart;
    const end = inserted ? gap.currentEnd : gap.baselineEnd;
    let shift = 0;
    while (
      gap.baselineEnd + shift < baselineLimit &&
      gap.currentEnd + shift < currentLimit &&
      lines[start + shift] === lines[end + shift]
    ) {
      shift++;
    }
    return {
      baselineStart: gap.baselineStart + shift,
      baselineEnd: gap.baselineEnd + shift,
      currentStart: gap.currentStart + shift,
      currentEnd: gap.currentEnd + shift,
    };
  });

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
    gaps: slideGaps(gaps, baseline, current),
  };
};
