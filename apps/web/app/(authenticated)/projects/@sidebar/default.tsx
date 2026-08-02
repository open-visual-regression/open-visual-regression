import { cookies } from "next/headers";

import { getSidebarData } from "@/lib/components/sidebar/getSidebarData";
import { getInitialSidebarCollapsed } from "@/lib/stores/sidebarCookie";
import { serverError } from "@/lib/utils/errors";

import { ProjectsSidebar } from "./_components/ProjectsSidebar";

export default async function ProjectsSidebarSlot() {
  const { error, projects, total, builds } = await getSidebarData();

  if (error) {
    serverError(error);
  }

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
