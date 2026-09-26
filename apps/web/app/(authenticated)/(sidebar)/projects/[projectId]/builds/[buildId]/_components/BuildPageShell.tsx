type BuildPageShellProps = {
  header: React.ReactNode;
  filters: React.ReactNode;
  search: React.ReactNode;
  grid: React.ReactNode;
};

export const BuildPageShell = ({ header, filters, search, grid }: BuildPageShellProps) => (
  <div className="flex flex-col gap-6">
    {header}
    <div className="flex flex-wrap items-center justify-between gap-3">
      {filters}
      {search}
    </div>
    {grid}
  </div>
);
