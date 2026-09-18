import Link from "next/link";

import { cn } from "@ovr/ui/lib/utils";

type SidebarSectionProps = {
  label: string;
  /** Turns the section's heading into a link to the full listing. */
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
    <div className="flex shrink-0 items-center gap-1 px-3 pt-3.5 pb-1.5 whitespace-nowrap">
      <h2 className="text-badge font-semibold tracking-label uppercase text-ovr-fg-tertiary">
        {href ? (
          <Link
            href={href}
            onClick={onNavigate}
            className="text-inherit no-underline transition-colors hover:text-ovr-fg"
          >
            {label}
          </Link>
        ) : (
          label
        )}
      </h2>
      {count !== undefined ? <span className="text-badge text-ovr-fg-muted">({count})</span> : null}
    </div>
    {children}
  </div>
);

export { SidebarSection };
export type { SidebarSectionProps };
