import Link from "next/link";

import { ChevronRightIcon, Icon } from "@ovr/ui/components/icon";
import { cn } from "@ovr/ui/lib/utils";

type SidebarSectionProps = {
  label: string;
  href?: string;
  onNavigate?: () => void;
  count?: number;
  className?: string;
  children?: React.ReactNode;
};

const SidebarSection = ({
  label,
  href,
  onNavigate,
  count,
  className,
  children,
}: SidebarSectionProps) => (
  <div className={cn("flex flex-col", className)}>
    {href ? (
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "flex shrink-0 items-center gap-1 h-7 px-3 whitespace-nowrap no-underline transition-colors",
          "text-ovr-fg-tertiary hover:bg-ovr-hover hover:text-ovr-fg",
        )}
      >
        <h2 className="text-badge font-semibold tracking-label uppercase text-inherit">{label}</h2>
        {count !== undefined ? (
          <span className="text-badge text-ovr-fg-muted">({count})</span>
        ) : null}
        <Icon icon={ChevronRightIcon} size={12} className="ml-auto shrink-0" />
      </Link>
    ) : (
      <div className="flex shrink-0 items-center gap-1 px-3 pt-3.5 pb-1.5 whitespace-nowrap">
        <h2 className="text-badge font-semibold tracking-label uppercase text-ovr-fg-tertiary">
          {label}
        </h2>
        {count !== undefined ? (
          <span className="text-badge text-ovr-fg-muted">({count})</span>
        ) : null}
      </div>
    )}
    {children}
  </div>
);

export { SidebarSection };
export type { SidebarSectionProps };
