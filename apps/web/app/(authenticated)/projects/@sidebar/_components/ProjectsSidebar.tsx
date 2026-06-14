"use client";

import { usePathname } from "next/navigation";
import { ProjectDto } from "@ovr/api/contracts/projects";
import { Sidebar } from "@/lib/components/sidebar/Sidebar";
import { SidebarCollapsedLink } from "@/lib/components/sidebar/SidebarCollapsedLink";
import { SidebarCollapsedSectionLabel } from "@/lib/components/sidebar/SidebarCollapsedSectionLabel";
import { SidebarMonogram } from "@/lib/components/sidebar/SidebarMonogram";
import {
  ProjectsSidebarLinks,
  isProjectActive,
} from "@/lib/components/sidebar/ProjectsSidebarLinks";

type ProjectsSidebarProps = {
  projects: Pick<ProjectDto, "id" | "name">[];
  version?: string;
  initialCollapsed?: boolean;
};

const ProjectsSidebar = ({ projects, version, initialCollapsed }: ProjectsSidebarProps) => {
  const pathname = usePathname();

  return (
    <Sidebar
      version={version}
      initialCollapsed={initialCollapsed}
      expandedContent={<ProjectsSidebarLinks projects={projects} />}
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
