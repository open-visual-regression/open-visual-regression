import { type BuildsCursor } from "@ovr/api/contracts/builds";

export const BUILDS_PAGE_SIZE = 20;

type BuildsListInput = {
  projectIds: string[];
  search: string | undefined;
  limit: number;
  cursor: BuildsCursor | undefined;
};

type BuildsListInfiniteOptions = {
  input: (cursor: BuildsCursor | undefined) => BuildsListInput;
  initialPageParam: BuildsCursor | undefined;
  getNextPageParam: (lastPage: { nextCursor: BuildsCursor | null }) => BuildsCursor | undefined;
};

// Shared by the server prefetch and the client query so their keys match.
export const buildsListInfiniteOptions = (
  projectId: string,
  search?: string,
): BuildsListInfiniteOptions => ({
  input: (cursor) => ({ projectIds: [projectId], search, limit: BUILDS_PAGE_SIZE, cursor }),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});
