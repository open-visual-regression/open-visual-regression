type SnapshotShellProps = {
  actions: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
};

export const SnapshotShell = ({ actions, sidebar, children }: SnapshotShellProps) => (
  <div className="absolute inset-0 flex flex-col">
    {actions}
    <div className="relative flex min-h-0 flex-1 flex-row overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-3 md:px-6 md:py-4 lg:px-10 lg:py-6">
        {children}
      </div>
      {sidebar}
    </div>
  </div>
);
