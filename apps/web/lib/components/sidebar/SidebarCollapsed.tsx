import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { Icon } from "@ovr/ui/components/icon";
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
      <span className="text-[9px] font-semibold tracking-label uppercase text-ovr-fg-tertiary">
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
      <button
        onClick={onExpand}
        title="expand sidebar"
        className="size-6 inline-flex items-center justify-center rounded-sm bg-transparent border border-ovr-border text-ovr-fg-secondary hover:bg-ovr-hover transition-colors"
      >
        <Icon icon={ChevronRightIcon} size={12} />
      </button>
    </div>
  </aside>
);

export { SidebarCollapsed };
export type { SidebarCollapsedProps, SidebarCollapsedProject };
