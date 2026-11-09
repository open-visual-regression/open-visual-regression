export const SIDEBAR_PROJECTS_LIMIT = 5;
export const SIDEBAR_RECENT_BUILDS_LIMIT = 50;

export const SIDEBAR_PROJECTS_QUERY = { input: { limit: SIDEBAR_PROJECTS_LIMIT } } as const;
export const SIDEBAR_RECENT_BUILDS_QUERY = {
  input: { limit: SIDEBAR_RECENT_BUILDS_LIMIT },
} as const;
