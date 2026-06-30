"use client";

import { BuildSchema } from "@ovr/api/contracts/builds";
import { ProjectDto } from "@ovr/api/contracts/projects";
import { usePathname } from "next/navigation";

import {
  ProjectsSidebarLinks,
  isProjectActive,
} from "@/lib/components/sidebar/ProjectsSidebarLinks";
import { RecentBuildsSidebarLinks } from "@/lib/components/sidebar/RecentBuildsSidebarLinks";
import { Sidebar } from "@/lib/components/sidebar/Sidebar";
import { SidebarCollapsedLink } from "@/lib/components/sidebar/SidebarCollapsedLink";
import { SidebarCollapsedSectionLabel } from "@/lib/components/sidebar/SidebarCollapsedSectionLabel";
import { SidebarMonogram } from "@/lib/components/sidebar/SidebarMonogram";

type ProjectsSidebarProps = {
  projects: Pick<ProjectDto, "id" | "name">[];
  total: number;
  builds: BuildSchema[];
  version?: string;
  initialCollapsed?: boolean;
};

const ProjectsSidebar = ({
  projects,
  total,
  builds,
  version,
  initialCollapsed,
}: ProjectsSidebarProps) => {
  const pathname = usePathname();

  return (
    <Sidebar
      version={version}
      initialCollapsed={initialCollapsed}
      expandedContent={
        <div className="flex min-h-0 flex-1 flex-col">
          <ProjectsSidebarLinks projects={projects} total={total} />
          <RecentBuildsSidebarLinks builds={builds} />
        </div>
      }
      collapsedContent={
        <>
          <SidebarCollapsedSectionLabel label="prj" />
          {projects.map((p) => {
            const active = isProjectActive(pathname, p.id);
            return (
              <SidebarCollapsedLink
                key={p.id}
                href={`/projects/${p.id}`}
                title={p.name}
                active={active}
              >
                <SidebarMonogram name={p.name} active={active} />
              </SidebarCollapsedLink>
            );
          })}
        </>
      }
    />
  );
};

export { ProjectsSidebar };
export type { ProjectsSidebarProps };
