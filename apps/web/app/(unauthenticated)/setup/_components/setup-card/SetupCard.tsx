import { ButtonSkeleton } from "@ovr/ui/components/button";
import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { FieldGroup, FieldSkeleton } from "@ovr/ui/components/field";
import { Typography } from "@ovr/ui/components/typography";

import { SetupForm, SetupFormLayout } from "./SetupForm";

type SetupCardShellProps = {
  children: React.ReactNode;
};

const SetupCardShell = ({ children }: SetupCardShellProps) => (
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
    <CardContent>{children}</CardContent>
  </Card>
);

export const SetupCard = () => (
  <SetupCardShell>
    <SetupForm />
  </SetupCardShell>
);

// Setup always opens on the organization step.
export const SetupCardSkeleton = () => (
  <SetupCardShell>
    <SetupFormLayout step={1}>
      <FieldGroup aria-hidden>
        <FieldSkeleton label="organization name" />
        <ButtonSkeleton size="lg" className="w-full">
          next
        </ButtonSkeleton>
      </FieldGroup>
    </SetupFormLayout>
  </SetupCardShell>
);
