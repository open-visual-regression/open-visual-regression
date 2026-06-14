"use client";

import { usePathname } from "next/navigation";
import { FolderIcon } from "@ovr/ui/components/icon";
import { ProjectDto } from "@ovr/api/contracts/projects";
import { SidebarItem } from "@/lib/components/sidebar/SidebarItem";
import { SidebarSection } from "@/lib/components/sidebar/SidebarSection";

type ProjectsSidebarLinksProps = {
  projects: Pick<ProjectDto, "id" | "name">[];
  onNavigate?: () => void;
};

const isProjectActive = (pathname: string, projectId: string) =>
  pathname.startsWith(`/projects/${projectId}`);

const ProjectsSidebarLinks = ({ projects, onNavigate }: ProjectsSidebarLinksProps) => {
  const pathname = usePathname();

  return (
    <SidebarSection label="projects" count={projects.length}>
      {projects.map((p) => (
        <SidebarItem
          key={p.id}
          href={`/projects/${p.id}`}
          icon={FolderIcon}
          label={p.name}
          active={isProjectActive(pathname, p.id)}
          onClick={onNavigate}
        />
      ))}
    </SidebarSection>
  );
};

export { ProjectsSidebarLinks, isProjectActive };
export type { ProjectsSidebarLinksProps };
