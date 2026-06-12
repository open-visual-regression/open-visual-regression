import { SidebarContainer } from "@/lib/components/sidebar/SidebarContainer";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

export default async function SidebarPage() {
  const [error, projectsResult] = await serverClient.projects.list();

  if (error) {
    serverError();
  }

  return (
    <SidebarContainer
      projects={projectsResult.projects}
      version={process.env.npm_package_version}
    />
  );
}
