import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { SIDEBAR_PROJECTS_LIMIT, SIDEBAR_RECENT_BUILDS_LIMIT } from "./_components/constants";
import { ProjectsSidebar } from "./_components/ProjectsSidebar";

export default async function ProjectsSidebarSlot() {
  const [[listError, listResult], [countError, countResult], [buildsError, buildsResult]] =
    await Promise.all([
      serverClient.projects.list({ limit: SIDEBAR_PROJECTS_LIMIT }),
      serverClient.projects.count(),
      serverClient.builds.list({ limit: SIDEBAR_RECENT_BUILDS_LIMIT }),
    ]);

  if (listError || countError || buildsError) {
    serverError(listError || countError || buildsError);
  }

  const { projects } = listResult;
  const { total } = countResult;
  const { builds } = buildsResult;

  return (
    <ProjectsSidebar
      projects={projects}
      total={total}
      builds={builds}
      version={process.env.npm_package_version}
    />
  );
}
