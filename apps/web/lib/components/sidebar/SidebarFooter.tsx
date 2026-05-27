import { Button } from "@ovr/ui/components/button";
import { Icon, ChevronLeftIcon } from "@ovr/ui/components/icon";

type SidebarFooterProps = {
  version?: string;
  onCollapse?: () => void;
};

const SidebarFooter = ({ version = "0.0.0", onCollapse }: SidebarFooterProps) => (
  <div className="mt-auto px-3 py-3 border-t border-ovr-border-subtle flex items-center gap-2">
    <Button variant="secondary" size="icon-xs" onClick={onCollapse} aria-label="Collapse sidebar">
      <Icon icon={ChevronLeftIcon} size={12} />
    </Button>
    <div className="flex items-center gap-1.5 text-badge text-ovr-fg-muted">
      <span>ovr</span>
      <span>v{version}</span>
    </div>
    <span className="ml-auto text-badge text-ovr-fg-muted">self-hosted</span>
  </div>
);

export { SidebarFooter };
export type { SidebarFooterProps };
