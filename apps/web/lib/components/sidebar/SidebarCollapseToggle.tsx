import { Button } from "@ovr/ui/components/button";
import { Icon, ChevronLeftIcon, ChevronRightIcon } from "@ovr/ui/components/icon";

type SidebarCollapseToggleProps = {
  direction: "left" | "right";
  label: string;
  onClick?: () => void;
};

const SidebarCollapseToggle = ({ direction, label, onClick }: SidebarCollapseToggleProps) => (
  <Button variant="outline" color="neutral" size="icon-xs" onClick={onClick} aria-label={label}>
    <Icon icon={direction === "left" ? ChevronLeftIcon : ChevronRightIcon} size={12} />
  </Button>
);

export { SidebarCollapseToggle };
export type { SidebarCollapseToggleProps };
