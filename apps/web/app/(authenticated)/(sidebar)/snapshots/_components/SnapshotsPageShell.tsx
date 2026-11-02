type SnapshotsPageShellProps = {
  heading: React.ReactNode;
  filters: React.ReactNode;
  content: React.ReactNode;
};

export const SnapshotsPageShell = ({ heading, filters, content }: SnapshotsPageShellProps) => (
  <div className="flex flex-col gap-3">
    {heading}
    <div className="flex flex-wrap items-center justify-between gap-3">{filters}</div>
    {content}
  </div>
);
