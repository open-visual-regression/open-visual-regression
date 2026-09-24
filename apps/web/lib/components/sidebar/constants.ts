export const SIDEBAR_PROJECTS_LIMIT = 10;
export const SIDEBAR_RECENT_BUILDS_LIMIT = 30;

// Shared by the server prefetch and the client queries, so both resolve to the same query keys.
export const SIDEBAR_PROJECTS_QUERY = { input: { limit: SIDEBAR_PROJECTS_LIMIT } } as const;
export const SIDEBAR_RECENT_BUILDS_QUERY = {
  input: { limit: SIDEBAR_RECENT_BUILDS_LIMIT },
} as const;
