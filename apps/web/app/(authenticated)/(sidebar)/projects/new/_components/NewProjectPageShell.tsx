import { Typography } from "@ovr/ui/components/typography";

type NewProjectPageShellProps = {
  children: React.ReactNode;
};

export const NewProjectPageShell = ({ children }: NewProjectPageShellProps) => (
  <div className="flex flex-col gap-6 w-full lg:w-1/2">
    <div className="flex justify-between items-center">
      <Typography variant="h1" as="h1">
        new project
      </Typography>
    </div>
    {children}
  </div>
);
