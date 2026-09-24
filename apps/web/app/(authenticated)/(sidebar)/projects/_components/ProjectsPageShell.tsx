type ProjectsPageShellProps = {
  heading: React.ReactNode;
  action: React.ReactNode;
  content: React.ReactNode;
};

export const ProjectsPageShell = ({ heading, action, content }: ProjectsPageShellProps) => (
  <div className="flex flex-col gap-6">
    <div className="flex justify-between items-center">
      {heading}
      {action}
    </div>
    {content}
  </div>
);
