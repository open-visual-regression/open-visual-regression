"use client";

import { BuildSchema } from "@ovr/api/contracts/builds";
import { ProjectDto } from "@ovr/api/contracts/projects";

import { ProjectsSidebarLinks } from "@/lib/components/sidebar/ProjectsSidebarLinks";
import { RecentBuildsSidebarLinks } from "@/lib/components/sidebar/RecentBuildsSidebarLinks";
import { Sidebar } from "@/lib/components/sidebar/Sidebar";

type ProjectsSidebarProps = {
  projects: Pick<ProjectDto, "id" | "name">[];
  total: number;
  builds: BuildSchema[];
  version?: string;
};

const ProjectsSidebar = ({ projects, total, builds, version }: ProjectsSidebarProps) => (
  <Sidebar version={version}>
    <div className="flex min-h-0 flex-1 flex-col">
      <ProjectsSidebarLinks projects={projects} total={total} />
      <RecentBuildsSidebarLinks builds={builds} />
    </div>
  </Sidebar>
);

export { ProjectsSidebar };
export type { ProjectsSidebarProps };
