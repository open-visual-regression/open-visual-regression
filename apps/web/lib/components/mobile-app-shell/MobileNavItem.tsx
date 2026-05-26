import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@ovr/ui/components/icon";
import { cn } from "@ovr/ui/lib/utils";

type MobileNavItemProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

const MobileNavItem = ({ href, icon, label, active, onClick }: MobileNavItemProps) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-2.5 h-10 px-3 text-[13px] no-underline border-l-2 transition-colors",
      active
        ? "text-ovr-fg bg-ovr-active border-l-ovr-accent"
        : "text-ovr-fg-secondary border-l-transparent hover:bg-ovr-hover",
    )}
  >
    <Icon icon={icon} size={13} className="text-ovr-fg-tertiary shrink-0" />
    <span>{label}</span>
  </Link>
);

export { MobileNavItem };
export type { MobileNavItemProps };
