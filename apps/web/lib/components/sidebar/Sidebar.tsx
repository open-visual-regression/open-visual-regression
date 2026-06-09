import { FolderIcon } from "@ovr/ui/components/icon";
import { SidebarSection } from "./SidebarSection";
import { SidebarItem } from "./SidebarItem";
import { SidebarFooter } from "./SidebarFooter";

type SidebarProject = {
  id: string;
  name: string;
  changedCount?: number;
};

type SidebarProps = {
  projects: SidebarProject[];
  activeProjectId?: string;
  version?: string;
  onCollapse?: () => void;
};

const Sidebar = ({ projects, activeProjectId, version, onCollapse }: SidebarProps) => (
  <aside className="flex h-full w-60 shrink-0 flex-col overflow-hidden border-r border-ovr-border bg-background">
    <SidebarSection label="projects" count={projects.length}>
      {projects.map((p) => (
        <SidebarItem
          key={p.id}
          href={`/projects/${p.id}`}
          icon={FolderIcon}
          label={p.name}
          changedCount={p.changedCount}
          active={p.id === activeProjectId}
        />
      ))}
    </SidebarSection>
    <SidebarFooter version={version} onCollapse={onCollapse} />
  </aside>
);

export { Sidebar };
export type { SidebarProps, SidebarProject };
