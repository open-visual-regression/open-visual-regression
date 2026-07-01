import { defaultShouldDehydrateQuery, isServer, QueryClient } from "@tanstack/react-query";

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Data prefetched on the server stays fresh long enough that the client
        // does not immediately refetch the first page after hydration.
        staleTime: 60 * 1000,
      },
      dehydrate: {
        // Include pending queries so streamed prefetches can be dehydrated too.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });

let browserQueryClient: QueryClient | undefined;

/**
 * Returns a QueryClient scoped to the current environment: a fresh instance per
 * request on the server (never shared across users), and a lazily-created
 * singleton in the browser.
 */
export const getQueryClient = () => {
  if (isServer) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
};
