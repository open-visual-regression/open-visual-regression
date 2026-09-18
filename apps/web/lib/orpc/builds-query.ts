import { type BuildStatus, type BuildsCursor } from "@ovr/api/contracts/builds";

const BUILDS_PAGE_SIZE = 50;

export type BuildsListFilters = {
  /** Omit to list every build the caller can read, across all projects. */
  projectIds?: string[];
  search?: string;
  statuses?: BuildStatus[];
  branches?: string[];
  authors?: string[];
};

type BuildsListInput = {
  projectIds: string[] | undefined;
  search: string | undefined;
  statuses: BuildStatus[] | undefined;
  branches: string[] | undefined;
  authors: string[] | undefined;
  limit: number;
  cursor: BuildsCursor | undefined;
};

type BuildsListInfiniteOptions = {
  input: (cursor: BuildsCursor | undefined) => BuildsListInput;
  initialPageParam: BuildsCursor | undefined;
  getNextPageParam: (lastPage: { nextCursor: BuildsCursor | null }) => BuildsCursor | undefined;
};

export const buildsListInfiniteOptions = ({
  projectIds,
  search,
  statuses,
  branches,
  authors,
}: BuildsListFilters = {}): BuildsListInfiniteOptions => ({
  input: (cursor) => ({
    projectIds,
    search,
    statuses,
    branches,
    authors,
    limit: BUILDS_PAGE_SIZE,
    cursor,
  }),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});
