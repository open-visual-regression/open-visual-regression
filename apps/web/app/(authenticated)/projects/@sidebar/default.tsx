import { cookies } from "next/headers";
import { serverClient } from "@/lib/router";
import { getInitialSidebarCollapsed } from "@/lib/stores/sidebarCookie";
import { serverError } from "@/lib/utils/errors";
import { ProjectsSidebar } from "./_components/ProjectsSidebar";

const SIDEBAR_PROJECTS_LIMIT = 10;

// A few more than an xl desktop sidebar can show at once; the sidebar clips to
// whichever of these fit without rendering a partial row.
const SIDEBAR_RECENT_BUILDS_LIMIT = 20;

export default async function ProjectsSidebarSlot() {
  const [[listError, listResult], [countError, countResult], [buildsError, buildsResult]] =
    await Promise.all([
      serverClient.projects.list({ limit: SIDEBAR_PROJECTS_LIMIT }),
      serverClient.projects.count(),
      serverClient.builds.list({ limit: SIDEBAR_RECENT_BUILDS_LIMIT }),
    ]);

  if (listError || countError || buildsError) {
    serverError();
  }

  const { projects } = listResult;
  const { total } = countResult;
  const { builds } = buildsResult;
  const initialCollapsed = getInitialSidebarCollapsed(await cookies());

  return (
    <ProjectsSidebar
      projects={projects}
      total={total}
      builds={builds}
      version={process.env.npm_package_version}
      initialCollapsed={initialCollapsed}
    />
  );
}
