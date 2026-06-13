import { SidebarCollapseToggle } from "./SidebarCollapseToggle";

type SidebarFooterProps = {
  version?: string;
  collapseLabel?: string;
  onCollapse?: () => void;
};

const SidebarFooter = ({
  version = "0.0.0",
  collapseLabel = "Collapse sidebar",
  onCollapse,
}: SidebarFooterProps) => (
  <div className="mt-auto px-3 py-3 border-t border-ovr-border-subtle flex items-center gap-2">
    <SidebarCollapseToggle direction="left" label={collapseLabel} onClick={onCollapse} />
    <div className="flex items-center gap-1.5 text-badge text-ovr-fg-muted">
      <span>ovr</span>
      <span>v{version}</span>
    </div>
  </div>
);

export { SidebarFooter };
export type { SidebarFooterProps };
