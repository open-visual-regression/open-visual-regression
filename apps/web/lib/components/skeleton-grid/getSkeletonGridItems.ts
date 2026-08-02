const ROWS = 3;

type ColumnTier = {
  columns: number;
  className: string;
};

export const getSkeletonGridItems = (tiers: ColumnTier[]) =>
  tiers.flatMap(({ columns, className }, index) => {
    const previousColumns = index === 0 ? 0 : tiers[index - 1]!.columns;

    return Array.from({ length: ROWS * (columns - previousColumns) }, (_, item) => ({
      key: `${index}-${item}`,
      className,
    }));
  });
