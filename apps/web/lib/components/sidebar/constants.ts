export const SIDEBAR_PROJECTS_LIMIT = 10;
export const SIDEBAR_RECENT_BUILDS_LIMIT = 30;

export const SIDEBAR_PROJECTS_QUERY = { input: { limit: SIDEBAR_PROJECTS_LIMIT } } as const;
export const SIDEBAR_RECENT_BUILDS_QUERY = {
  input: { limit: SIDEBAR_RECENT_BUILDS_LIMIT },
} as const;
