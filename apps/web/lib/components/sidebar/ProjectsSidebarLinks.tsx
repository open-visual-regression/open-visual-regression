"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, FolderIcon, Icon } from "@ovr/ui/components/icon";
import { ProjectDto } from "@ovr/api/contracts/projects";
import { cn } from "@ovr/ui/lib/utils";
import { SidebarItem } from "@/lib/components/sidebar/SidebarItem";
import { SidebarSection } from "@/lib/components/sidebar/SidebarSection";

type ProjectsSidebarLinksProps = {
  projects: Pick<ProjectDto, "id" | "name">[];
  total: number;
  onNavigate?: () => void;
};

const isProjectActive = (pathname: string, projectId: string) =>
  pathname.startsWith(`/projects/${projectId}`);

const ProjectsSidebarLinks = ({ projects, total, onNavigate }: ProjectsSidebarLinksProps) => {
  const pathname = usePathname();

  return (
    <SidebarSection label="projects" count={total} className="shrink-0">
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
      <Link
        href="/projects"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 h-7 pl-2.5 pr-3 text-body-sm border-l-2 border-l-transparent transition-colors no-underline",
          "text-ovr-fg-secondary hover:bg-ovr-hover hover:text-ovr-fg",
        )}
      >
        <Icon icon={ChevronRightIcon} size={12} className="text-ovr-fg-tertiary shrink-0" />
        <span className="flex-1 truncate">view all</span>
      </Link>
    </SidebarSection>
  );
};

export { ProjectsSidebarLinks, isProjectActive };
export type { ProjectsSidebarLinksProps };
