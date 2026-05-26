import type { LucideIcon } from "lucide-react";
import { Icon } from "@ovr/ui/components/icon";
import { cn } from "@ovr/ui/lib/utils";

type MobileTabBarItemProps = {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

const MobileTabBarItem = ({ icon, label, active, onClick }: MobileTabBarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 flex flex-col items-center justify-center gap-1 bg-transparent border-none cursor-pointer p-0 transition-colors",
      active ? "text-ovr-accent" : "text-ovr-fg-tertiary",
    )}
  >
    <Icon icon={icon} size={16} />
    <span className="text-[10px] tracking-[0.04em]">{label}</span>
  </button>
);

export { MobileTabBarItem };
export type { MobileTabBarItemProps };
