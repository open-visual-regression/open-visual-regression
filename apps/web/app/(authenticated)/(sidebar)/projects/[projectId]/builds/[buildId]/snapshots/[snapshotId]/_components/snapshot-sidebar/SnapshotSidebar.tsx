import { cn } from "@ovr/ui/lib/utils";

export type SnapshotSidebarProps = {
  collapsed: boolean;
  children: React.ReactNode;
};

export const SnapshotSidebar = ({ collapsed, children }: SnapshotSidebarProps) => (
  <aside
    aria-hidden={collapsed ? true : undefined}
    inert={collapsed ? true : undefined}
    className={cn(
      "absolute inset-y-0 right-0 z-10 flex w-full flex-col overflow-hidden border-l border-ovr-border bg-background transition-transform duration-200 ease-in-out",
      "lg:static lg:inset-auto lg:z-auto lg:w-120 lg:shrink-0 lg:translate-x-0 lg:transition-[width]",
      collapsed ? "translate-x-full lg:w-0 lg:border-l-0" : "translate-x-0",
    )}
  >
    <div className="w-full flex-1 overflow-y-auto lg:w-120">{children}</div>
  </aside>
);
