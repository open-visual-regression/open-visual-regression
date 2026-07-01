import { type BuildsCursor } from "@ovr/api/contracts/builds";

export const BUILDS_PAGE_SIZE = 20;

// Shared by the server prefetch and the client query so their keys match.
export const buildsListInfiniteOptions = (projectId: string, search?: string) => ({
  input: (cursor: BuildsCursor | undefined) => ({
    projectIds: [projectId],
    search,
    limit: BUILDS_PAGE_SIZE,
    cursor,
  }),
  initialPageParam: undefined as BuildsCursor | undefined,
  getNextPageParam: (lastPage: { nextCursor: BuildsCursor | null }) =>
    lastPage.nextCursor ?? undefined,
});
