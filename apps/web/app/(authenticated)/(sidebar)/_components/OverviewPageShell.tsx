type OverviewPageShellProps = {
  heading: React.ReactNode;
  links: React.ReactNode;
};

export const OverviewPageShell = ({ heading, links }: OverviewPageShellProps) => (
  <div className="flex flex-col gap-6">
    {heading}
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">{links}</ul>
  </div>
);
