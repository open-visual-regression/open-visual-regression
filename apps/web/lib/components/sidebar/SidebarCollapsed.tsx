import { SidebarCollapseToggle } from "./SidebarCollapseToggle";

type SidebarCollapsedProps = {
  expandLabel?: string;
  onExpand?: () => void;
  children?: React.ReactNode;
};

const SidebarCollapsed = ({
  expandLabel = "Expand sidebar",
  onExpand,
  children,
}: SidebarCollapsedProps) => (
  <aside className="flex h-full w-12 shrink-0 flex-col overflow-hidden border-r border-ovr-border">
    {children}
    <div className="mt-auto px-3 py-3 border-t border-ovr-border-subtle flex">
      <SidebarCollapseToggle direction="right" label={expandLabel} onClick={onExpand} />
    </div>
  </aside>
);

export { SidebarCollapsed };
export type { SidebarCollapsedProps };
