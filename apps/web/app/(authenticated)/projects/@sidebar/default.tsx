import { cookies } from "next/headers";
import { serverClient } from "@/lib/router";
import { getInitialSidebarCollapsed } from "@/lib/stores/sidebarCookie";
import { serverError } from "@/lib/utils/errors";
import { ProjectsSidebar } from "./_components/ProjectsSidebar";

export default async function ProjectsSidebarSlot() {
  const [error, projectsResult] = await serverClient.projects.list();

  if (error) {
    serverError();
  }

  const { projects } = projectsResult;
  const initialCollapsed = getInitialSidebarCollapsed(await cookies());

  return (
    <ProjectsSidebar
      projects={projects}
      version={process.env.npm_package_version}
      initialCollapsed={initialCollapsed}
    />
  );
}
