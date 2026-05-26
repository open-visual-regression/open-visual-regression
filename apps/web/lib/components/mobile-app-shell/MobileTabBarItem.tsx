import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@ovr/ui/components/icon";
import { cn } from "@ovr/ui/lib/utils";

type MobileTabBarItemProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
};

const MobileTabBarItem = ({ href, icon, label, active }: MobileTabBarItemProps) => (
  <Link
    href={href}
    className={cn(
      "flex-1 flex flex-col items-center justify-center gap-1 no-underline transition-colors",
      active ? "text-ovr-accent" : "text-ovr-fg-tertiary hover:text-ovr-fg",
    )}
  >
    <Icon icon={icon} size={16} />
    <span className="text-badge tracking-wider">{label}</span>
  </Link>
);

export { MobileTabBarItem };
export type { MobileTabBarItemProps };
