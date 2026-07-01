import { type BuildsCursor } from "@ovr/api/contracts/builds";

export const BUILDS_PAGE_SIZE = 20;

/**
 * Shared configuration for the builds infinite query. Using a single factory on
 * both the server (prefetch) and the client (`useInfiniteQuery`) guarantees the
 * generated query keys match, so server-prefetched data hydrates on the client.
 */
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
