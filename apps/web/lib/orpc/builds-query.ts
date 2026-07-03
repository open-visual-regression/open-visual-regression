import {
  type BuildStatus,
  type BuildsCursor,
  type ResolutionFilter,
  type ViewportSchema,
} from "@ovr/api/contracts/builds";

const BUILDS_PAGE_SIZE = 50;

export type BuildsListFilters = {
  statuses?: BuildStatus[];
  browsers?: ViewportSchema["browser"][];
  resolutions?: ResolutionFilter[];
};

type BuildsListInput = {
  projectIds: string[];
  search: string | undefined;
  statuses: BuildStatus[] | undefined;
  browsers: ViewportSchema["browser"][] | undefined;
  resolutions: ResolutionFilter[] | undefined;
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
    browsers: filters.browsers,
    resolutions: filters.resolutions,
    limit: BUILDS_PAGE_SIZE,
    cursor,
  }),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});
