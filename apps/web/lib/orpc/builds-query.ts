import { type BuildStatus, type BuildsCursor } from "@ovr/api/contracts/builds";

const BUILDS_PAGE_SIZE = 50;

export type BuildsListFilters = {
  statuses?: BuildStatus[];
};

type BuildsListInput = {
  projectIds: string[];
  search: string | undefined;
  statuses: BuildStatus[] | undefined;
  limit: number;
  cursor: BuildsCursor | undefined;
};

type BuildsListInfiniteOptions = {
  input: (cursor: BuildsCursor | undefined) => BuildsListInput;
  initialPageParam: BuildsCursor | undefined;
  getNextPageParam: (lastPage: { nextCursor: BuildsCursor | null }) => BuildsCursor | undefined;
};

export const buildsListInfiniteOptions = (
  projectId: string,
  search?: string,
  filters: BuildsListFilters = {},
): BuildsListInfiniteOptions => ({
  input: (cursor) => ({
    projectIds: [projectId],
    search,
    statuses: filters.statuses,
    limit: BUILDS_PAGE_SIZE,
    cursor,
  }),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});
