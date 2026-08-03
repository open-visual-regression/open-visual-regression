type ProjectPageShellProps = {
  header: React.ReactNode;
  filters: React.ReactNode;
  search: React.ReactNode;
  content: React.ReactNode;
};

export const ProjectPageShell = ({ header, filters, search, content }: ProjectPageShellProps) => (
  <div className="flex h-full min-h-0 flex-col gap-3">
    {header}
    <div className="flex flex-wrap items-center justify-between gap-3">
      {filters}
      {search}
    </div>
    {content}
  </div>
);
