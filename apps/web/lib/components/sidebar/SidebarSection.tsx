import { cn } from "@ovr/ui/lib/utils";

type SidebarSectionProps = {
  label: string;
  count?: number;
  className?: string;
  children?: React.ReactNode;
};

const SidebarSection = ({ label, count, className, children }: SidebarSectionProps) => (
  <div className={cn("flex flex-col", className)}>
    <div className="flex shrink-0 items-center gap-1 px-3 pt-3.5 pb-1.5 whitespace-nowrap">
      <h2 className="text-badge font-semibold tracking-label uppercase text-ovr-fg-tertiary">
        {label}
      </h2>
      {count !== undefined ? <span className="text-badge text-ovr-fg-muted">({count})</span> : null}
    </div>
    {children}
  </div>
);

export { SidebarSection };
export type { SidebarSectionProps };
