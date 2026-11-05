type SnapshotsPageShellProps = {
  heading: React.ReactNode;
  content: React.ReactNode;
};

export const SnapshotsPageShell = ({ heading, content }: SnapshotsPageShellProps) => (
  <div className="flex flex-col gap-3">
    {heading}
    {content}
  </div>
);
