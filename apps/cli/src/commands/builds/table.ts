export type BuildsTableRow = {
  id: string;
  status: string;
  branch: string;
  commit: string;
  project: string;
  name: string;
};

const HEADERS = ["BUILD", "STATUS", "BRANCH", "COMMIT", "PROJECT", "NAME"];

const SHORT_COMMIT_LENGTH = 7;

export const formatBuildsTable = (rows: BuildsTableRow[]): string => {
  const cells = rows.map((row) => [
    row.id,
    row.status,
    row.branch,
    row.commit.slice(0, SHORT_COMMIT_LENGTH),
    row.project,
    row.name,
  ]);

  const widths = HEADERS.map((header, index) =>
    Math.max(header.length, ...cells.map((row) => row[index]!.length)),
  );

  const formatRow = (row: string[]) =>
    row
      .map((cell, index) => cell.padEnd(widths[index]!))
      .join("  ")
      .trimEnd();

  return [formatRow(HEADERS), ...cells.map(formatRow)].join("\n");
};
