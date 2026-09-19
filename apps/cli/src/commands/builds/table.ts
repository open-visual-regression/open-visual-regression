import type { BuildSchema } from "@ovr/api/contracts/builds";

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

export type BuildsFilters = Record<string, string | string[] | undefined>;

export type BuildsOutput = {
  builds: BuildSchema[];
  total: number;
  nextCursor: string | null;
  filters?: BuildsFilters;
};

export const formatAppliedFilters = (filters: BuildsFilters | undefined): string | undefined => {
  const applied = Object.entries(filters ?? {}).flatMap(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    const present = values.filter((entry) => entry !== undefined && entry !== "");

    return present.length > 0 ? [`${key}=${present.join(",")}`] : [];
  });

  return applied.length > 0 ? `Filters: ${applied.join(", ")}` : undefined;
};

export const formatBuildsOutput = (
  { builds, total, nextCursor, filters }: BuildsOutput,
  json: boolean | undefined,
): string => {
  if (json) {
    return JSON.stringify({ builds, total, nextCursor }, null, 2);
  }

  if (builds.length === 0) {
    return [`No builds found.`, formatAppliedFilters(filters)].filter(Boolean).join("\n");
  }

  const table = formatBuildsTable(
    builds.map((build) => ({
      id: build.id,
      status: build.status,
      branch: build.branch,
      commit: build.commitSha,
      project: build.project.name,
      name: build.name ?? "",
    })),
  );

  if (!nextCursor) {
    return table;
  }

  return `${table}\n\nShowing ${builds.length} of ${total}. Next page: --cursor ${nextCursor}`;
};
