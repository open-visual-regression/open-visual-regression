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

/**
 * Aligns two lists of line hashes with a Myers diff (the algorithm behind
 * `git diff`), so lines that only moved still match. Returns the unmatched
 * gaps between them.
 */
export const alignLines = (baseline: Float64Array, current: Float64Array): LineAlignment => {
  const matches: Array<{ baselineStart: number; currentStart: number; length: number }> = [];
  diffSequences(
    baseline.length,
    current.length,
    (baselineIndex, currentIndex) => baseline[baselineIndex] === current[currentIndex],
    (length, baselineStart, currentStart) => {
      matches.push({ baselineStart, currentStart, length });
    },
  );

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
