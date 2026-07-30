import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { Typography } from "@ovr/ui/components/typography";

import { LoginForm } from "./LoginForm";

type LoginCardProps = {
  redirectTo: string;
};

export const LoginCard = ({ redirectTo }: LoginCardProps) => (
  <Card className="w-full">
    <CardHeader>
      <Typography variant="h2" as="h1">
        sign in
      </Typography>
    </CardHeader>
    <CardContent>
      <LoginForm redirectTo={redirectTo} />
    </CardContent>
  </Card>
);
