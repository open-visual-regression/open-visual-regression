/** How many full rows of placeholders a skeleton grid renders. */
const ROWS = 3;

type ColumnTier = {
  /** Columns the grid has at this breakpoint. */
  columns: number;
  /** Visibility class revealing this tier's items from that breakpoint up. */
  className: string;
};

/**
 * Builds the placeholder list for a responsive skeleton grid so that every
 * breakpoint renders full rows.
 *
 * A fixed count cannot do this: ten cards fill a 2- or 5-column grid but leave
 * an orphan in a 3-column one. Instead each tier contributes only the items the
 * extra columns need, revealed from its own breakpoint up, so the visible count
 * is always a multiple of the column count.
 *
 * @example
 * // grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
 * getSkeletonGridItems([
 *   { columns: 2, className: "" },
 *   { columns: 3, className: "hidden md:block" },
 *   { columns: 4, className: "hidden lg:block" },
 *   { columns: 5, className: "hidden xl:block" },
 * ]);
 * // 6 items visible at 2 columns, 9 at 3, 12 at 4, 15 at 5 — always 3 rows
 */
export const getSkeletonGridItems = (tiers: ColumnTier[]) =>
  tiers.flatMap(({ columns, className }, index) => {
    const previousColumns = index === 0 ? 0 : tiers[index - 1]!.columns;

    return Array.from({ length: ROWS * (columns - previousColumns) }, (_, item) => ({
      key: `${index}-${item}`,
      className,
    }));
  });
