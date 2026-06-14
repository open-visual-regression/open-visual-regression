type SidebarCollapsedSectionLabelProps = {
  label: string;
};

const SidebarCollapsedSectionLabel = ({ label }: SidebarCollapsedSectionLabelProps) => (
  <div className="flex items-center justify-center pt-3.5 pb-1.5">
    <span className="text-badge font-semibold tracking-label uppercase text-ovr-fg-tertiary">
      {label}
    </span>
  </div>
);

export { SidebarCollapsedSectionLabel };
export type { SidebarCollapsedSectionLabelProps };
