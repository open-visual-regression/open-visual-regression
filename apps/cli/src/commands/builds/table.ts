import type { BuildSchema } from "@ovr/api/contracts/builds";

import {
  formatAppliedFilters,
  formatNextPageHint,
  formatTable,
  type AppliedFilters,
} from "../../table";

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

export const formatBuildsTable = (rows: BuildsTableRow[]): string =>
  formatTable(
    HEADERS,
    rows.map((row) => [
      row.id,
      row.status,
      row.branch,
      row.commit.slice(0, SHORT_COMMIT_LENGTH),
      row.project,
      row.name,
    ]),
  );

export type BuildsOutput = {
  builds: BuildSchema[];
  total: number;
  nextCursor: string | null;
  filters?: AppliedFilters;
};

export const formatBuildsOutput = (
  { builds, total, nextCursor, filters }: BuildsOutput,
  json: boolean | undefined,
): string => {
  if (json) {
    return JSON.stringify({ builds, total, nextCursor }, null, 2);
  }

  if (builds.length === 0) {
    return ["No builds found.", formatAppliedFilters(filters)].filter(Boolean).join("\n");
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

  return `${table}\n\n${formatNextPageHint(builds.length, total, nextCursor)}`;
};
