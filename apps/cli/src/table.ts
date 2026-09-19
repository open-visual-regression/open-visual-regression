const COLUMN_GAP = "  ";

export const formatTable = (headers: string[], rows: string[][]): string => {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index]!.length)),
  );

  const formatRow = (row: string[]) =>
    row
      .map((cell, index) => cell.padEnd(widths[index]!))
      .join(COLUMN_GAP)
      .trimEnd();

  return [formatRow(headers), ...rows.map(formatRow)].join("\n");
};

export type AppliedFilters = Record<string, string | string[] | undefined>;

export const formatAppliedFilters = (filters: AppliedFilters | undefined): string | undefined => {
  const applied = Object.entries(filters ?? {}).flatMap(([flag, value]) => {
    const values = Array.isArray(value) ? value : [value];
    const present = values.filter((entry) => entry !== undefined && entry !== "");

    return present.length > 0 ? [`${flag}=${present.join(",")}`] : [];
  });

  return applied.length > 0 ? `Filters: ${applied.join(", ")}` : undefined;
};

export const formatNextPageHint = (shown: number, total: number, nextCursor: string): string =>
  `Showing ${shown} of ${total}. Next page: --cursor ${nextCursor}`;

/** Renders `[label, value]` pairs as aligned `label: value` lines, e.g. for a `get` command's detail view. */
export const formatKeyValueRows = (rows: [string, string][]): string => {
  const labelWidth = Math.max(...rows.map(([label]) => label.length));

  return rows.map(([label, value]) => `${`${label}:`.padEnd(labelWidth + 1)} ${value}`).join("\n");
};
