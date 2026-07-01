import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { Typography } from "@ovr/ui/components/typography";

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
