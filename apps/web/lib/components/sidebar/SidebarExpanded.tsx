import { SidebarFooter } from "./SidebarFooter";

type SidebarExpandedProps = {
  version?: string;
  collapseLabel?: string;
  onCollapse?: () => void;
  children?: React.ReactNode;
};

const SidebarExpanded = ({
  version,
  collapseLabel,
  onCollapse,
  children,
}: SidebarExpandedProps) => (
  <aside className="flex h-full w-60 shrink-0 flex-col overflow-hidden border-r border-ovr-border bg-background">
    {children}
    <SidebarFooter version={version} collapseLabel={collapseLabel} onCollapse={onCollapse} />
  </aside>
);

export { SidebarExpanded };
export type { SidebarExpandedProps };
