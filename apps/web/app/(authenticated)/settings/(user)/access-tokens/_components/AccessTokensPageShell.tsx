import { Typography } from "@ovr/ui/components/typography";

type AccessTokensPageShellProps = {
  children: React.ReactNode;
};

export const AccessTokensPageShell = ({ children }: AccessTokensPageShellProps) => (
  <div className="flex flex-col gap-6">
    <Typography variant="h1" as="h1">
      access tokens
    </Typography>
    <div className="flex w-full flex-col gap-6 md:w-3/4 lg:w-2/3">{children}</div>
  </div>
);
