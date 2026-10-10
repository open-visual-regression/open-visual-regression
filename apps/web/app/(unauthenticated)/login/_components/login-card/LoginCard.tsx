import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { FieldGroup, FieldSkeleton } from "@ovr/ui/components/field";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

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

export const LoginCardSkeleton = () => (
  <Card aria-hidden className="w-full">
    <CardHeader>
      <TypographySkeleton variant="h2" className="w-20" />
    </CardHeader>
    <CardContent>
      <FieldGroup>
        <FieldSkeleton />
        <FieldSkeleton />
        <Skeleton className="h-10 w-full rounded-lg" />
      </FieldGroup>
    </CardContent>
  </Card>
);
