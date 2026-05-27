type SidebarSectionProps = {
  label: string;
  count?: number;
  children?: React.ReactNode;
};

const SidebarSection = ({ label, count, children }: SidebarSectionProps) => (
  <div>
    <div className="flex items-center px-3 pt-3.5 pb-1.5 whitespace-nowrap">
      <span className="text-badge font-semibold tracking-label uppercase text-ovr-fg-tertiary">
        {label}
      </span>
      {count !== undefined ? (
        <span className="ml-auto text-badge text-ovr-fg-muted">{count}</span>
      ) : null}
    </div>
    {children}
  </div>
);

export { SidebarSection };
export type { SidebarSectionProps };
