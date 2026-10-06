import { Typography } from "@ovr/ui/components/typography";

type AccountPageShellProps = {
  children: React.ReactNode;
};

export const AccountPageShell = ({ children }: AccountPageShellProps) => (
  <div className="flex flex-col gap-6">
    <Typography variant="h1" as="h1">
      account
    </Typography>
    <div className="flex w-full flex-col gap-6 md:w-2/3 lg:w-1/2">{children}</div>
  </div>
);
