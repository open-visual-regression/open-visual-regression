import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@ovr/ui/components/icon";
import { cn } from "@ovr/ui/lib/utils";

type SidebarItemProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  changedCount?: number;
  active?: boolean;
};

const SidebarItem = ({ href, icon, label, changedCount, active }: SidebarItemProps) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-2 h-7 pl-[10px] pr-3 text-body-sm border-l-2 transition-colors no-underline",
      active
        ? "text-ovr-fg bg-ovr-active border-l-ovr-accent"
        : "text-ovr-fg-secondary border-l-transparent hover:bg-ovr-hover hover:text-ovr-fg",
    )}
  >
    <Icon icon={icon} size={12} className="text-ovr-fg-tertiary shrink-0" />
    <span className="flex-1 truncate">{label}</span>
    {changedCount !== undefined && changedCount > 0 && (
      <span className="ml-auto text-[10px] font-semibold text-ovr-accent">{changedCount}</span>
    )}
  </Link>
);

export { SidebarItem };
export type { SidebarItemProps };
