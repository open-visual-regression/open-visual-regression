type BuildsPageShellProps = {
  heading: React.ReactNode;
  filters: React.ReactNode;
  search: React.ReactNode;
  content: React.ReactNode;
};

export const BuildsPageShell = ({ heading, filters, search, content }: BuildsPageShellProps) => (
  <div className="flex h-full min-h-0 flex-col gap-3">
    {heading}
    <div className="flex flex-wrap items-center justify-between gap-3">
      {filters}
      {search}
    </div>
    {content}
  </div>
);
