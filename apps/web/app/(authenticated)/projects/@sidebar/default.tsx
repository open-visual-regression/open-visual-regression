import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";
import { ProjectsSidebar } from "./_components/ProjectsSidebar";

export default async function ProjectsSidebarSlot() {
  const [error, projectsResult] = await serverClient.projects.list();

  if (error) {
    serverError();
  }

  const { projects } = projectsResult;

  return <ProjectsSidebar projects={projects} version={process.env.npm_package_version} />;
}
