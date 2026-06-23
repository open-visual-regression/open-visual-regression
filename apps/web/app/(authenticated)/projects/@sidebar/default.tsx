import { cookies } from "next/headers";
import { serverClient } from "@/lib/router";
import { getInitialSidebarCollapsed } from "@/lib/stores/sidebarCookie";
import { serverError } from "@/lib/utils/errors";
import { ProjectsSidebar } from "./_components/ProjectsSidebar";

const SIDEBAR_PROJECTS_LIMIT = 10;

export default async function ProjectsSidebarSlot() {
  const [[listError, listResult], [countError, countResult]] = await Promise.all([
    serverClient.projects.list({ limit: SIDEBAR_PROJECTS_LIMIT }),
    serverClient.projects.count(),
  ]);

  if (listError || countError) {
    serverError();
  }

  const { projects } = listResult;
  const { total } = countResult;
  const initialCollapsed = getInitialSidebarCollapsed(await cookies());

  return (
    <ProjectsSidebar
      projects={projects}
      total={total}
      version={process.env.npm_package_version}
      initialCollapsed={initialCollapsed}
    />
  );
}
