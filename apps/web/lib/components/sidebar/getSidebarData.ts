import "server-only";
import { cache } from "react";

import { serverClient } from "@/lib/router";

const PROJECTS_LIMIT = 10;
const RECENT_BUILDS_LIMIT = 15;

export const getSidebarData = cache(async () => {
  const [[listError, listResult], [countError, countResult], [buildsError, buildsResult]] =
    await Promise.all([
      serverClient.projects.list({ limit: PROJECTS_LIMIT }),
      serverClient.projects.count(),
      serverClient.builds.list({ limit: RECENT_BUILDS_LIMIT }),
    ]);

  return {
    error: listError || countError || buildsError,
    projects: listResult?.projects ?? [],
    total: countResult?.total ?? 0,
    builds: buildsResult?.builds ?? [],
  };
});
