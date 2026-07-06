export type SnapshotSidebarProps = {
  children: React.ReactNode;
};

export const SnapshotSidebar = ({ children }: SnapshotSidebarProps) => (
  <aside className="flex h-full w-120 shrink-0 flex-col overflow-hidden border-l border-ovr-border bg-background">
    <div className="flex-1 overflow-y-auto">{children}</div>
  </aside>
);
