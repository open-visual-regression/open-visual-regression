import { ChevronLeftIcon } from "lucide-react";
import { Icon } from "@ovr/ui/components/icon";

type SidebarFooterProps = {
  version?: string;
  onCollapse?: () => void;
};

const SidebarFooter = ({ version = "0.0.0", onCollapse }: SidebarFooterProps) => (
  <div className="mt-auto px-3 py-3 border-t border-ovr-border-subtle flex items-center gap-2">
    <button
      onClick={onCollapse}
      title="collapse sidebar"
      className="size-6 inline-flex items-center justify-center rounded-sm bg-transparent border border-ovr-border text-ovr-fg-secondary hover:bg-ovr-hover transition-colors"
    >
      <Icon icon={ChevronLeftIcon} size={12} />
    </button>
    <div className="flex items-center gap-1.5 text-badge text-ovr-fg-muted">
      <span>ovr</span>
      <span>v{version}</span>
    </div>
    <span className="ml-auto text-badge text-ovr-fg-muted">self-hosted</span>
  </div>
);

export { SidebarFooter };
export type { SidebarFooterProps };
