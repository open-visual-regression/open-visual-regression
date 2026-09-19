type BuildsPageShellProps = {
  heading: React.ReactNode;
  content: React.ReactNode;
};

export const BuildsPageShell = ({ heading, content }: BuildsPageShellProps) => (
  <div className="flex h-full min-h-0 flex-col gap-3">
    {heading}
    {content}
  </div>
);
