import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { Typography } from "@ovr/ui/components/typography";
import { LoginForm } from "./LoginForm";

export const LoginCard = () => (
  <Card className="w-full">
    <CardHeader>
      <Typography variant="h2" as="h1">
        sign in
      </Typography>
    </CardHeader>
    <CardContent>
      <LoginForm />
    </CardContent>
  </Card>
);
