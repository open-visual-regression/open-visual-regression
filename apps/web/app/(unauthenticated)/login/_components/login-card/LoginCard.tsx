import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { Typography } from "@ovr/ui/components/typography";

import { LoginForm } from "./LoginForm";

type LoginCardProps = {
  redirectPath: string;
};

export const LoginCard = ({ redirectPath }: LoginCardProps) => (
  <Card className="w-full">
    <CardHeader>
      <Typography variant="h2" as="h1">
        sign in
      </Typography>
    </CardHeader>
    <CardContent>
      <LoginForm redirectPath={redirectPath} />
    </CardContent>
  </Card>
);
