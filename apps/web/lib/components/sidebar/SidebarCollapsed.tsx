import Link from "next/link";
import { Button } from "@ovr/ui/components/button";
import { Icon, ChevronRightIcon } from "@ovr/ui/components/icon";
import { cn } from "@ovr/ui/lib/utils";
import { SidebarMonogram } from "./SidebarMonogram";

type SidebarCollapsedProject = {
  id: string;
  name: string;
  changedCount?: number;
};

type SidebarCollapsedProps = {
  projects: SidebarCollapsedProject[];
  activeProjectId?: string;
  onExpand?: () => void;
};

const SidebarCollapsed = ({ projects, activeProjectId, onExpand }: SidebarCollapsedProps) => (
  <aside className="flex h-full w-12 shrink-0 flex-col overflow-hidden border-r border-ovr-border">
    <div className="flex items-center justify-center h-6 pt-2">
      <span className="text-badge font-semibold tracking-label uppercase text-ovr-fg-tertiary">
        prj
      </span>
    </div>

    {projects.map((p) => {
      const active = p.id === activeProjectId;
      return (
        <Link
          key={p.id}
          href={`/projects/${p.id}/runs`}
          title={p.name}
          className={cn(
            "flex h-8 items-center justify-center border-l-2 no-underline transition-colors relative",
            active
              ? "bg-ovr-active border-l-ovr-accent"
              : "border-l-transparent hover:bg-ovr-hover",
          )}
        >
          <SidebarMonogram name={p.name} changedCount={p.changedCount} active={active} />
        </Link>
      );
    })}

    <div className="mt-auto p-2 border-t border-ovr-border-subtle flex justify-center">
      <Button variant="secondary" size="icon-xs" onClick={onExpand} aria-label="Expand sidebar">
        <Icon icon={ChevronRightIcon} size={12} />
      </Button>
    </div>
  </aside>
);

export { SidebarCollapsed };
export type { SidebarCollapsedProps, SidebarCollapsedProject };
