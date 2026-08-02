import Link from "next/link";

import type { LucideIcon } from "@ovr/ui/components/icon";
import { Icon } from "@ovr/ui/components/icon";
import { cn } from "@ovr/ui/lib/utils";

type SidebarItemProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  changedCount?: number;
  active?: boolean;
  onClick?: () => void;
};

const SidebarItem = ({ href, icon, label, changedCount, active, onClick }: SidebarItemProps) => (
  <Link
    href={href}
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={cn(
      "flex items-center gap-2 h-7 pl-2.5 pr-3 text-body-sm border-l-2 transition-colors no-underline",
      active
        ? "text-ovr-fg bg-ovr-active border-l-ovr-accent"
        : "text-ovr-fg-secondary border-l-transparent hover:bg-ovr-hover hover:text-ovr-fg",
    )}
  >
    <Icon icon={icon} size={12} className="text-ovr-fg-tertiary shrink-0" />
    <span className="flex-1 truncate">{label}</span>
    {(changedCount ?? 0) > 0 ? (
      <span className="ml-auto text-badge font-semibold text-ovr-accent">{changedCount}</span>
    ) : null}
  </Link>
);

export { SidebarItem };
export type { SidebarItemProps };
