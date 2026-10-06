import { ButtonSkeleton } from "@ovr/ui/components/button";
import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { FieldGroup, FieldSkeleton } from "@ovr/ui/components/field";
import { Typography } from "@ovr/ui/components/typography";

import { LoginForm } from "./LoginForm";

type LoginCardShellProps = {
  children: React.ReactNode;
};

const LoginCardShell = ({ children }: LoginCardShellProps) => (
  <Card className="w-full">
    <CardHeader>
      <Typography variant="h2" as="h1">
        sign in
      </Typography>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

type LoginCardProps = {
  redirectPath: string;
};

export const LoginCard = ({ redirectPath }: LoginCardProps) => (
  <LoginCardShell>
    <LoginForm redirectPath={redirectPath} />
  </LoginCardShell>
);

export const LoginCardSkeleton = () => (
  <LoginCardShell>
    <FieldGroup aria-hidden>
      <FieldSkeleton label="email" />
      <FieldSkeleton label="password" />
      <ButtonSkeleton size="lg" className="w-full">
        sign in
      </ButtonSkeleton>
    </FieldGroup>
  </LoginCardShell>
);
