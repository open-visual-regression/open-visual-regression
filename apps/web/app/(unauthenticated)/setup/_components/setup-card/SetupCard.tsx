import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { FieldGroup, FieldSkeleton } from "@ovr/ui/components/field";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { SetupForm } from "./SetupForm";

export const SetupCard = () => (
  <Card className="w-full">
    <CardHeader>
      <Typography variant="h2" as="h1">
        first-run setup
      </Typography>
      <Typography className="text-muted-foreground">
        no users exist yet. you must create the organization and the first admin account to
        continue.
      </Typography>
    </CardHeader>
    <CardContent>
      <SetupForm />
    </CardContent>
  </Card>
);

export const SetupCardSkeleton = () => (
  <Card aria-hidden className="w-full">
    <CardHeader>
      <TypographySkeleton variant="h2" className="w-36" />
      <TypographySkeleton variant="body" className="w-full" />
    </CardHeader>
    <CardContent>
      <FieldGroup>
        <FieldSkeleton />
        <Skeleton className="h-10 w-full rounded-lg" />
      </FieldGroup>
    </CardContent>
  </Card>
);
