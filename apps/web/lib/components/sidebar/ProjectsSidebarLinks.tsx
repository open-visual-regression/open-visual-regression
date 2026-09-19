"use client";

import { usePathname } from "next/navigation";

import { ProjectDto } from "@ovr/api/contracts/projects";
import { FolderIcon } from "@ovr/ui/components/icon";

import { SidebarItem } from "@/lib/components/sidebar/SidebarItem";
import { SidebarSection } from "@/lib/components/sidebar/SidebarSection";

type ProjectsSidebarLinksProps = {
  projects: Pick<ProjectDto, "id" | "name">[];
  total: number;
  onNavigate?: () => void;
};

const isProjectActive = (pathname: string, projectId: string) =>
  pathname.startsWith(`/projects/${projectId}`) &&
  !pathname.startsWith(`/projects/${projectId}/builds`);

const ProjectsSidebarLinks = ({ projects, total, onNavigate }: ProjectsSidebarLinksProps) => {
  const pathname = usePathname();

  return (
    <SidebarSection
      label="projects"
      href="/projects"
      onNavigate={onNavigate}
      count={total}
      className="shrink-0"
    >
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
