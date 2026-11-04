type SnapshotsPageShellProps = {
  heading: React.ReactNode;
  filters: React.ReactNode;
  search: React.ReactNode;
  content: React.ReactNode;
};

export const SnapshotsPageShell = ({
  heading,
  filters,
  search,
  content,
}: SnapshotsPageShellProps) => (
  <div className="flex flex-col gap-3">
    {heading}
    <div className="flex flex-wrap items-center justify-between gap-3">
      {filters}
      {search}
    </div>
    {content}
  </div>
);
