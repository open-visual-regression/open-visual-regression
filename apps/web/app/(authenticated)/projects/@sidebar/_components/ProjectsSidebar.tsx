"use client";

import { usePathname } from "next/navigation";
import { FolderIcon } from "@ovr/ui/components/icon";
import { ProjectDto } from "@ovr/api/contracts/projects";
import { Sidebar } from "@/lib/components/sidebar/Sidebar";
import { SidebarCollapsedLink } from "@/lib/components/sidebar/SidebarCollapsedLink";
import { SidebarItem } from "@/lib/components/sidebar/SidebarItem";
import { SidebarMonogram } from "@/lib/components/sidebar/SidebarMonogram";
import { SidebarSection } from "@/lib/components/sidebar/SidebarSection";

type ProjectsSidebarProps = {
  projects: Pick<ProjectDto, "id" | "name">[];
  version?: string;
};

const isProjectActive = (pathname: string, projectId: string) =>
  pathname.startsWith(`/projects/${projectId}`);

const ProjectsSidebar = ({ projects, version }: ProjectsSidebarProps) => {
  const pathname = usePathname();

  return (
    <Sidebar
      version={version}
      expandedContent={
        <SidebarSection label="projects" count={projects.length}>
          {projects.map((p) => (
            <SidebarItem
              key={p.id}
              href={`/projects/${p.id}`}
              icon={FolderIcon}
              label={p.name}
              active={isProjectActive(pathname, p.id)}
            />
          ))}
        </SidebarSection>
      }
      collapsedContent={
        <>
          <div className="flex items-center justify-center pt-3.5 pb-1.5">
            <span className="text-badge font-semibold tracking-label uppercase text-ovr-fg-tertiary">
              prj
            </span>
          </div>
          {projects.map((p) => {
            const active = isProjectActive(pathname, p.id);
            return (
              <SidebarCollapsedLink
                key={p.id}
                href={`/projects/${p.id}/runs`}
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
