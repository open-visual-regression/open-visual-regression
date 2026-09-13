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

export const formatBuildsOutput = (builds: BuildSchema[], json: boolean | undefined): string => {
  if (json) {
    return JSON.stringify(builds, null, 2);
  }

  if (builds.length === 0) {
    return "No builds found.";
  }

  return formatBuildsTable(
    builds.map((build) => ({
      id: build.id,
      status: build.status,
      branch: build.branch,
      commit: build.commitSha,
      project: build.project.name,
      name: build.name ?? "",
    })),
  );
};
